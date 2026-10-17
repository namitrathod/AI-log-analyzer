import { useState } from 'react';
import axios from 'axios';
import ResultCard from './ResultCard';

const API = '';
const EMPTY = { logText: '', source: '', logType: '' };
const selStyle = { background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', padding: 12, width: '100%',
  fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' };

export default function BatchAnalyzer() {
  const [logs, setLogs] = useState([{ ...EMPTY }, { ...EMPTY }]);
  const [parallel, setParallel] = useState(true);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (i, field, val) =>
    setLogs(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  const addLog = () => { if (logs.length < 20) setLogs(p => [...p, { ...EMPTY }]); };
  const removeLog = i => { if (logs.length > 1) setLogs(p => p.filter((_, idx) => idx !== i)); };

  const analyze = async () => {
    const valid = logs.filter(l => l.logText.trim().length >= 10);
    if (!valid.length) return;
    setLoading(true); setError(null); setResponse(null);
    try {
      const res = await axios.post(`${API}/api/logs/analyze/batch`, { logs: valid, parallel }, { timeout: 120000 });
      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{logs.length} logs · max 20</div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          fontSize: 13, color: 'var(--text-muted)' }}>
          <div onClick={() => setParallel(p => !p)} style={{ width: 40, height: 22,
            borderRadius: 11, position: 'relative',
            background: parallel ? 'var(--accent)' : 'var(--surface2)',
            border: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', top: 2, left: parallel ? 20 : 2,
              width: 16, height: 16, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s' }} />
          </div>
          {parallel ? 'Parallel (faster)' : 'Sequential'}
        </label>
      </div>
      {logs.map((log, i) => (
        <div key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 20, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 4, padding: '3px 10px' }}>Log #{i + 1}</span>
            {logs.length > 1 && (
              <button onClick={() => removeLog(i)} style={{ background: 'transparent',
                color: 'var(--critical)', fontSize: 20, padding: '0 6px' }}>×</button>
            )}
          </div>
          <textarea value={log.logText} onChange={e => update(i, 'logText', e.target.value)}
            placeholder={`Paste log #${i + 1} here...`} rows={5} />
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <input value={log.source} onChange={e => update(i, 'source', e.target.value)}
              placeholder="Source (optional)" style={{ resize: 'none' }} />
            <select value={log.logType} onChange={e => update(i, 'logType', e.target.value)} style={selStyle}>
              <option value="">Auto-detect</option>
              <option value="java_stacktrace">Java Stack Trace</option>
              <option value="nginx_error">Nginx Error</option>
              <option value="sql_error">SQL Error</option>
              <option value="python_traceback">Python Traceback</option>
            </select>
          </div>
        </div>
      ))}
      {logs.length < 20 && (
        <button onClick={addLog} style={{ width: '100%', padding: 12, background: 'transparent',
          color: 'var(--accent)', border: '2px dashed var(--border)',
          borderRadius: 12, fontSize: 14, marginBottom: 20 }}>+ Add Another Log</button>
      )}
      <button onClick={analyze} disabled={loading || logs.every(l => !l.logText.trim())} style={{
        width: '100%', padding: 14, fontSize: 15, marginBottom: 24,
        background: loading ? 'var(--surface2)' : 'var(--accent)', color: '#fff',
        boxShadow: loading ? 'none' : '0 0 20px var(--accent-glow)' }}>
        {loading ? `⟳ Analyzing... this may take 30-60 seconds` : '⚡ Analyze Batch'}
      </button>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '12px 16px', color: 'var(--critical)',
          fontSize: 13, marginBottom: 20 }}>⚠️ {error}</div>
      )}
      {response && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))',
            gap: 12, marginBottom: 28, background: 'var(--surface2)',
            border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            {[
              { label: 'Total Logs',    value: response.totalLogs,            color: 'var(--accent)' },
              { label: 'Successful',    value: response.successCount,         color: 'var(--success)' },
              { label: 'Failed',        value: response.failureCount,         color: 'var(--high)' },
              { label: 'Critical',      value: response.criticalCount,        color: 'var(--critical)' },
              { label: 'High Severity', value: response.highCount,            color: 'var(--high)' },
              { label: 'Total Time',    value: `${response.totalProcessingTimeMs}ms`, color: 'var(--text-muted)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {response.results.map((r, i) => <ResultCard key={i} result={r} index={i} />)}
        </div>
      )}
    </div>
  );
}
