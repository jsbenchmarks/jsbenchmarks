import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { results as rawResults } from '../data';
import type { RawResult } from '../types';
import './FrameworkDetails.css';
import { TraceViewer } from './TraceViewer';

const inputData = rawResults as RawResult[];

export function FrameworkDetails() {
    const { framework } = useParams<{ framework: string }>();
    const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
    const data = inputData.find(r => r.framework === framework);

    if (!data) {
        return <div className="FrameworkDetails-error">Framework not found</div>;
    }

    // Determine max runs
    const maxRuns = data.benchmarks.reduce((max, b) => Math.max(max, b.measurements.length), 0);
    const runs = Array.from({ length: maxRuns }, (_, i) => i);
    console.log(data);
    return (
        <div className="FrameworkDetails">
            <div className="FrameworkDetails-header">
                <Link to="/" className="FrameworkDetails-back">&larr; Back to Results</Link>
                <div className="FrameworkDetails-title-row">
                    <h1>
                        {data.framework}
                        {data.version !== 'unknown' && (
                            <span className="FrameworkDetails-version">v{data.version}</span>
                        )}
                    </h1>

                    <div className="FrameworkDetails-links">
                        {data.website && <a href={data.website} target="_blank" rel="noopener noreferrer">Website</a>}
                        {data.gitHubUrl && <a href={data.gitHubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>}
                    </div>
                </div>
            </div>

            <h2 className="FrameworkDetails-h2">Duration in ms</h2>
            <div className="FrameworkDetails-table-container">
                <table className="FrameworkDetails-table">
                    <thead>
                        <tr>
                            <th></th>
                            {runs.map(i => <th key={i}>Run {i + 1}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {data.benchmarks.filter(bm => bm.name !== 'stream').map(bench => (
                            <tr key={bench.name}>
                                <td className="FrameworkDetails-bench-name">{bench.name}</td>
                                {runs.map(i => {
                                    const m = bench.measurements[i];
                                    if (!m) return <td key={i}>-</td>;
                                    return (
                                        <td
                                            key={i}
                                            className="FrameworkDetails-cell"
                                            title={m.traceFile ? "Click to view trace" : undefined}
                                            onClick={() => m.traceFile && setSelectedTrace(m.traceFile)}
                                            style={{ cursor: m.traceFile ? 'pointer' : 'default' }}
                                        >
                                            <div className="FrameworkDetails-duration">
                                                {m.duration > 0 ? m.duration.toFixed(1) : (m.cpu ? `${m.cpu.toFixed(1)}%` : '-')}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2 className="FrameworkDetails-h2">Memory in MB</h2>
            <div className="FrameworkDetails-table-container">
                <table className="FrameworkDetails-table">
                    <thead>
                        <tr>
                            <th></th>
                            {runs.map(i => <th key={i}>Run {i + 1}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {data.benchmarks.filter(bm => bm.name !== 'stream').map(bench => (
                            <tr key={bench.name}>
                                <td className="FrameworkDetails-bench-name">{bench.name}</td>
                                {runs.map(i => {
                                    const m = bench.measurements[i];
                                    if (!m) return <td key={i}>-</td>;
                                    return (
                                        <td
                                            key={i}
                                            className="FrameworkDetails-cell"
                                        >
                                            <div className="FrameworkDetails-duration">
                                                {m.memory ? (m.memory / 1e6).toFixed(1) : '-'}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedTrace && (
                <TraceViewer traceFile={selectedTrace} onClose={() => setSelectedTrace(null)} />
            )}
        </div>
    );
}
