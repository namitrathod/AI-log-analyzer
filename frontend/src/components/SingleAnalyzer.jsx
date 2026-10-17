import { useState } from 'react';
import axios from 'axios';
import ResultCard from './ResultCard';

const API = '';
const EXAMPLE = `java.lang.NullPointerException: Cannot invoke "String.length()" because "str" is null
\tat com.example.service.UserService.processUsername(UserService.java:47)
\tat com.example.controller.UserController.createUser(UserController.java:23)`;

export default function SingleAnalyzer() {
  const [logText, setLogText] = useState('');
  const [source, setSource] = useState('');
  const [logType, setLogType] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async () => {
    if (!logText.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await axios.post(`${API}/api/logs/analyze`, { logText, source, logType }, { timeout: 120000 });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  const selStyle = { background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--text)', padding: 12, width: '100%',
    outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 13 };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700,
          color: 'var(--text-muted)', letterSpacing: '0.08em',
          textTransform: 'uppercase', marginBottom: 8 }}>
          Log / Stack Trace / Error Message
        </label>
        <textarea value={logText} onChange={e => setLogText(e.target.value)}
          placeholder="Paste your log here..." rows={10} />
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              Source (optional)
            </label>
            <input value={source} onChange={e => setSource(e.target.value)}
              placeholder="e.g. prod-server-1" style={{ resize: 'none' }} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              Log Type (optional)
            </label>
            <select value={logType} onChange={e => setLogType(e.target.value)} style={selStyle}>
              <option value="">Auto-detect</option>
              <option value="java_stacktrace">Java Stack Trace</option>
              <option value="nginx_error">Nginx Error</option>
              <option value="sql_error">SQL Error</option>
              <option value="python_traceback">Python Traceback</option>
              <option value="kubernetes_event">Kubernetes Event</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <button onClick={analyze} disabled={loading || !logText.trim()} style={{
            background: loading ? 'var(--surface2)' : 'var(--accent)', color: '#fff',
            padding: '10px 28px', fontSize: 14,
            boxShadow: loading ? 'none' : '0 0 16px var(--accent-glow)' }}>
            {loading ? '⟳ Analyzing... (may take 20-30 seconds)' : '⚡ Analyze Log'}
          </button>
          <button onClick={() => setLogText(EXAMPLE)} style={{ background: 'var(--surface2)',
            color: 'var(--text-muted)', padding: '10px 20px', fontSize: 13,
            border: '1px solid var(--border)' }}>Load Example</button>
          {(result || error) && (
            <button onClick={() => { setResult(null); setError(null); }} style={{
              background: 'transparent', color: 'var(--text-muted)',
              padding: '10px 20px', fontSize: 13, border: '1px solid var(--border)' }}>
              Clear
            </button>
          )}
        </div>
      </div>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 8, padding: '12px 16px', color: 'var(--critical)',
          fontSize: 13, marginBottom: 20 }}>⚠️ {error}</div>
      )}
      {loading && (
        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 24 }}>
          {['60%', '80%', '70%'].map((w, i) => (
            <div key={i} style={{ height: 16, background: 'var(--surface)', borderRadius: 4,
              width: w, marginBottom: 12, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      )}
      {result && <ResultCard result={result} />}
    </div>
  );
}
