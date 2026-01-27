import { useEffect, useState } from 'react';
import './TraceViewer.css';

interface TraceViewerProps {
    traceFile: string;
    onClose: () => void;
}

interface TraceEvent {
    name: string;
    cat: string;
    ph: string;
    ts: number;
    dur?: number;
    args?: { data?: { type?: string } };
    pid: number;
    tid: number;
    level?: number;
}

export function TraceViewer({ traceFile, onClose }: TraceViewerProps) {
    const [events, setEvents] = useState<TraceEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeWindow, setTimeWindow] = useState<{ start: number, end: number, duration: number } | null>(null);

    useEffect(() => {
        // eslint-disable-next-line
        setLoading(true);
        setError(null);
        fetch(`/traces/${traceFile}`)
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load trace: ${res.statusText}`);
                return res.json();
            })
            .then(data => {
                const rawEvents = data.traceEvents as TraceEvent[];

                // Logic from benchmark/process-results.js
                const clickEvent = rawEvents.find(e =>
                    e.name === 'EventDispatch' &&
                    e.args?.data?.type === 'click'
                );
                
                const markEvent = rawEvents.find(e =>
                    e.cat.includes('blink.user_timing') &&
                    e.name === 'bench-dom-done'
                );

                if (!clickEvent || !markEvent) {
                    throw new Error("Could not find start (click) or end (bench-dom-done) markers.");
                }

                const commitEvent = rawEvents.find(e =>
                    e.name === 'Commit' &&
                    e.ts >= markEvent.ts
                );

                if (!commitEvent) {
                    throw new Error("Could not find Commit event after benchmark done.");
                }

                const startTs = clickEvent.ts;
                const endTs = commitEvent.ts + (commitEvent.dur || 0);
                const duration = endTs - startTs;

                const relevantEvents = rawEvents.filter(e => {
                    if (e.ph !== 'X' || !e.dur || e.dur <= 0) return false;
                    if (e.name === 'RunTask') return false;
                    if (e.name.includes('GC') || e.cat.toLowerCase().includes('gc')) return false;
                    const eventEnd = e.ts + e.dur;
                    return eventEnd > startTs && e.ts < endTs;
                })
                .sort((a, b) => {
                    if (a.ts !== b.ts) return a.ts - b.ts;
                    return (b.dur || 0) - (a.dur || 0);
                });

                let maxLevel = 0;
                const stack: { endTs: number, level: number }[] = [];

                const processedEvents = relevantEvents.map(e => {
                    const eventEnd = e.ts + (e.dur || 0);
                    while (stack.length > 0 && stack[stack.length - 1].endTs <= e.ts) {
                        stack.pop();
                    }
                    const level = stack.length;
                    stack.push({ endTs: eventEnd, level });
                    maxLevel = Math.max(maxLevel, level);

                    return { ...e, level };
                });

                setEvents(processedEvents);
                setTimeWindow({ start: startTs, end: endTs, duration });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, [traceFile]);

    const getEventColor = (e: TraceEvent) => {
        if (e.name === 'EvaluateScript' || e.name === 'FunctionCall' || e.name === 'v8.compile' || e.cat.includes('v8') || e.name === 'EventDispatch') {
            return 'yellow'; 
        }
        else if (e.name === 'Layout' || e.name === 'UpdateLayerTree' || e.name === 'UpdateLayoutTree' || e.name === 'RecalculateStyles' || e.name === 'HitTest' || e.name === 'Pre-paint' || e.name === 'PrePaint' || e.name === 'Layerize') {
            return 'purple'; 
        }
        else if (e.name === 'Paint' || e.name === 'CompositeLayers' || e.name === 'RasterTask' || e.name === 'Commit') {
            return 'green'; 
        }
        return 'gray';
    };

    const getEventStyle = (e: TraceEvent) => {
        if (!timeWindow) return {};
        const start = Math.max(e.ts, timeWindow.start);
        const end = Math.min(e.ts + (e.dur || 0), timeWindow.end);
        const dur = Math.max(0, end - start);
        
        const leftPct = ((start - timeWindow.start) / timeWindow.duration) * 100;
        const widthPct = (dur / timeWindow.duration) * 100;
        const top = 0;
        return {
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            top: `${top}px`,
        };
    };

    return (
        <div className="TraceViewer-overlay" onClick={onClose}>
            <div className="TraceViewer-modal" onClick={e => e.stopPropagation()}>
                <div className="TraceViewer-header">
                    <h2>Trace: {traceFile}</h2>
                    <button className="TraceViewer-close" onClick={onClose}>&times;</button>
                </div>
                {loading && <div className="TraceViewer-loading">Loading trace data...</div>}
                {error && <div className="TraceViewer-error">{error}</div>}
                {!loading && !error && timeWindow && (
                    <div className="TraceViewer-content">
                        <div className="TraceViewer-timeline-container" style={{ height: '60px' }}>
                             <div className="TraceViewer-timeline" style={{ height: '100%' }}>
                                 {events.map((e, i) => {
                                     const colorClass = getEventColor(e);
                                     if (colorClass === 'gray') return null; 
                                     
                                     return (
                                         <div 
                                            key={i}
                                            className={`TraceViewer-event ${colorClass}`}
                                            style={getEventStyle(e)}
                                            title={`${e.name} (${((e.dur || 0) / 1000).toFixed(2)}ms)`}
                                         />
                                     );
                                 })}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
