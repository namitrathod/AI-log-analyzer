export default function Header({ activeTab, setActiveTab }) {
  return (
    <header style={{ borderBottom: '1px solid var(--border)', padding: '0 32px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 64, background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, boxShadow: '0 0 12px var(--accent-glow)' }}>⚡</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Log Analyzer</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}></div>
        </div>
      </div>
      <nav style={{ display: 'flex', gap: 4, background: 'var(--bg)',
        borderRadius: 8, padding: 4, border: '1px solid var(--border)' }}>
        {['Single', 'Batch'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '6px 20px', borderRadius: 6, fontSize: 13,
            background: activeTab === tab ? 'var(--accent)' : 'transparent',
            color: activeTab === tab ? '#fff' : 'var(--text-muted)',
            boxShadow: activeTab === tab ? '0 0 10px var(--accent-glow)' : 'none' }}>
            {tab}{tab === 'Batch' ? ' (up to 20)' : ''}
          </button>
        ))}
      </nav>
    </header>
  );
}
