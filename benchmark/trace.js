export function analyzeTrace(trace) {
  const events = trace.traceEvents;
  const clickEvent = events.find(e =>
    e.name === 'EventDispatch' &&
    e.args?.data?.type === 'click'
  );
  const markEvent = events.find(e =>
    e.cat.includes('blink.user_timing') &&
    e.name === 'bench-dom-done'
  );

  // Not all benchmarks emit a mark (e.g. duration-based benchmarks like stream).
  // Return 0 to mean "not applicable".
  if (!clickEvent || !markEvent) return 0;

  const targetEvent = events.find(e =>
    e.name === 'Commit' &&
    e.ts >= markEvent.ts
  );

  if (!targetEvent) return 0;

  // Use the end of the event duration
  return (targetEvent.ts + (targetEvent.dur || 0) - clickEvent.ts) / 1000;
}
