import { useState } from 'react';
import Header from './components/Header';
import SingleAnalyzer from './components/SingleAnalyzer';
import BatchAnalyzer from './components/BatchAnalyzer';

export default function App() {
  const [activeTab, setActiveTab] = useState('Single');
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1px', marginBottom: 8 }}>
            {activeTab === 'Single' ? '⚡ Analyze a Log' : '📦 Batch Analysis'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            {activeTab === 'Single'
              ? 'Paste any log, stack trace, or error message for an instant AI diagnosis.'
              : 'Analyze up to 20 logs at once — processed in parallel for speed.'}
          </p>
        </div>
        {activeTab === 'Single' ? <SingleAnalyzer /> : <BatchAnalyzer />}
      </main>
    </div>
  );
}
