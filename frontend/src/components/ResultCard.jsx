const SEV = {
  CRITICAL: { color: 'var(--critical)', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'   },
  HIGH:     { color: 'var(--high)',     bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.3)'  },
  MEDIUM:   { color: 'var(--medium)',   bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.3)'   },
  LOW:      { color: 'var(--low)',      bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)'   },
  UNKNOWN:  { color: 'var(--text-muted)', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)' },
};

function Section({ icon, title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon} {title}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.7, background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
        {children}
      </div>
    </div>
  );
}

export default function ResultCard({ result, index }) {
  if (!result) return null;
  const sev = SEV[result.severity] || SEV.UNKNOWN;
  if (!result.success) {
    return (
      <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ color: 'var(--critical)', fontWeight: 700, marginBottom: 4 }}>
          ❌ Analysis Failed{result.source ? ` — ${result.source}` : ''}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {result.errorMessage}
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: 24, marginBottom: 16, animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {index !== undefined && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 4, padding: '2px 8px' }}>#{index + 1}</span>
          )}
          {result.source && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)' }}>
              📌 {result.source}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            color: sev.color, background: sev.bg, border: `1px solid ${sev.border}` }}>
            {result.severity}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {result.processingTimeMs}ms
          </span>
        </div>
      </div>
      <Section icon="📋" title="Summary">{result.summary}</Section>
      <Section icon="🔍" title="Root Cause">{result.rootCause}</Section>
      <Section icon="🔧" title="Suggested Fix">{result.suggestedFix}</Section>
    </div>
  );
}
