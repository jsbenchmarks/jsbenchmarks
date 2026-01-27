import { useEffect, useState, useRef } from 'react';
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
}

export function TraceViewer({ traceFile, onClose }: TraceViewerProps) {
    const [events, setEvents] = useState<TraceEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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
                // Filter for 'X' (Complete) events with duration
                const meaningfulEvents = rawEvents.filter(e => e.ph === 'X' && e.dur && e.dur > 0).sort((a, b) => a.ts - b.ts);

                if (meaningfulEvents.length === 0) {
                    setError("No meaningful events found in trace.");
                } else {
                    setEvents(meaningfulEvents);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, [traceFile]);

    useEffect(() => {
        if (loading || events.length === 0 || !canvasRef.current || !containerRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas to fit container
        const width = containerRef.current.clientWidth;
        canvas.width = width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const startTs = events[0].ts;
        const endTs = events[events.length - 1].ts + (events[events.length - 1].dur || 0);
        const totalDuration = endTs - startTs;

        // Draw background
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, width, height);

        // Draw events
        events.forEach(e => {
            const x = ((e.ts - startTs) / totalDuration) * width;
            const w = Math.max(1, ((e.dur || 0) / totalDuration) * width); // Ensure at least 1px visible

            let color = '#ccc';
            // Simplified categorization logic
            if (e.name === 'EvaluateScript' || e.name === 'FunctionCall' || e.name === 'v8.compile' || e.name === 'RunTask' || e.cat.includes('v8')) {
                color = '#f1c453'; // Yellow (Scripting)
            }
            else if (e.name === 'Layout' || e.name === 'UpdateLayerTree' || e.name === 'RecalculateStyles' || e.name === 'HitTest') {
                color = '#998ec3'; // Purple (Rendering)
            }
            else if (e.name === 'Paint' || e.name === 'CompositeLayers' || e.name === 'RasterTask') {
                color = '#77bd6e'; // Green (Painting)
            }
            else if (e.name === 'GCEvent' || e.name === 'MajorGC' || e.name === 'MinorGC') {
                color = '#e05c5c'; // Red (System/GC)
            }

            ctx.fillStyle = color;
            ctx.fillRect(x, 20, w, 60);
        });

        // Draw timeline labels (Start and End)
        ctx.fillStyle = '#333';
        ctx.font = '10px sans-serif';
        ctx.fillText('0ms', 5, 15);
        ctx.fillText(`${(totalDuration / 1000).toFixed(1)}ms`, width - 40, 15);

    }, [events, loading]);

    return (
        <div className="TraceViewer-overlay" onClick={onClose}>
            <div className="TraceViewer-modal" onClick={e => e.stopPropagation()}>
                <div className="TraceViewer-header">
                    <h2>Trace: {traceFile}</h2>
                    <button className="TraceViewer-close" onClick={onClose}>&times;</button>
                </div>
                {loading && <div className="TraceViewer-loading">Loading trace data...</div>}
                {error && <div className="TraceViewer-error">{error}</div>}
                {!loading && !error && (
                    <div className="TraceViewer-content" ref={containerRef}>
                        <canvas ref={canvasRef} height={100} className="TraceViewer-canvas" />
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
