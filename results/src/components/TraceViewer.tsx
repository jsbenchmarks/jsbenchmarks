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
    args?: any;
    pid: number;
    tid: number;
    level?: number;
}

export function TraceViewer({ traceFile, onClose }: TraceViewerProps) {
    const [events, setEvents] = useState<TraceEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeWindow, setTimeWindow] = useState<{ start: number, end: number, duration: number } | null>(null);
    const [maxDepth, setMaxDepth] = useState(0);

    useEffect(() => {
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

                // Filter for events within the window
                const relevantEvents = rawEvents.filter(e => {
                    if (e.ph !== 'X' || !e.dur || e.dur <= 0) return false;
                    const eventEnd = e.ts + e.dur;
                    return eventEnd > startTs && e.ts < endTs;
                })
                .sort((a, b) => {
                    // Sort by start time, then by duration (descending) to ensure containers come first
                    if (a.ts !== b.ts) return a.ts - b.ts;
                    return (b.dur || 0) - (a.dur || 0);
                });

                // Assign levels (flame chart logic)
                let maxLevel = 0;
                // Stack contains { endTs, level }
                const stack: { endTs: number, level: number }[] = [];

                const processedEvents = relevantEvents.map(e => {
                    const eventEnd = e.ts + (e.dur || 0);
                    
                    // Pop events that have ended
                    // We need to find the correct level. 
                    // Standard flame chart: check stack top. If current starts after stack top ends, pop.
                    // But we want to pack tightly if possible, or strict stack?
                    // Strict stack (call stack) is safer for traces.
                    
                    // Remove items from stack that end before this event starts
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
                setMaxDepth(maxLevel + 1);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, [traceFile]);

    const getEventColor = (e: TraceEvent) => {
        if (e.name === 'EvaluateScript' || e.name === 'FunctionCall' || e.name === 'v8.compile' || e.name === 'RunTask' || e.cat.includes('v8') || e.name === 'EventDispatch') {
            return 'yellow'; 
        }
        else if (e.name === 'Layout' || e.name === 'UpdateLayerTree' || e.name === 'RecalculateStyles' || e.name === 'HitTest') {
            return 'purple'; 
        }
        else if (e.name === 'Paint' || e.name === 'CompositeLayers' || e.name === 'RasterTask' || e.name === 'Commit') {
            return 'green'; 
        }
        else if (e.name === 'GCEvent' || e.name === 'MajorGC' || e.name === 'MinorGC') {
            return 'red'; 
        }
        return 'gray';
    };

    // Helper to calculate style
    const getEventStyle = (e: TraceEvent) => {
        if (!timeWindow) return {};
        const start = Math.max(e.ts, timeWindow.start);
        const end = Math.min(e.ts + (e.dur || 0), timeWindow.end);
        const dur = Math.max(0, end - start);
        
        const leftPct = ((start - timeWindow.start) / timeWindow.duration) * 100;
        const widthPct = (dur / timeWindow.duration) * 100;
        
        const rowHeight = 20; // px
        const top = (e.level || 0) * rowHeight;

        return {
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            top: `${top}px`,
            height: '18px'
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
                        <div className="TraceViewer-timeline-container">
                             <div className="TraceViewer-timeline" style={{ height: Math.max(100, maxDepth * 20) + 'px' }}>
                                 {events.map((e, i) => {
                                     const colorClass = getEventColor(e);
                                     if (colorClass === 'gray') return null; 
                                     
                                     return (
                                         <div 
                                            key={i}
                                            className={`TraceViewer-event ${colorClass}`}
                                            style={getEventStyle(e)}
                                            title={`${e.name} (${(e.dur || 0).toFixed(2)}ms)`}
                                         />
                                     );
                                 })}
                             </div>
                        </div>
                        <div className="TraceViewer-timeline-labels">
                            <span>0ms</span>
                            <span>{(timeWindow.duration / 1000).toFixed(1)}ms</span>
                        </div>
                        <div className="TraceViewer-legend">
                            <div className="TraceViewer-legend-item"><span className="swatch yellow"></span> Scripting</div>
                            <div className="TraceViewer-legend-item"><span className="swatch purple"></span> Rendering</div>
                            <div className="TraceViewer-legend-item"><span className="swatch green"></span> Painting</div>
                            <div className="TraceViewer-legend-item"><span className="swatch red"></span> GC / System</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
