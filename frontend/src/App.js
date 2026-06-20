import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import 'react-flow-renderer/dist/style.css';
import 'react-flow-renderer/dist/theme-default.css';
import './index.css';
import Dashboard from './pages/Dashboard';
import GraphView from './pages/GraphView';
import DocumentUpload from './pages/DocumentUpload';
import { Sun, Moon } from 'lucide-react';

function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', transition: 'all 0.3s' }}>
        <nav className="glass-panel" style={{ width: '260px', margin: '16px', padding: '24px', display: 'flex', flexDirection: 'column', background: 'var(--sidebar-bg)', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <h2 style={{ margin: 0, color: 'var(--sidebar-text)', fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px' }}>
              <span style={{ color: '#38bdf8' }}>AI</span>Compliance
            </h2>
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><Link to="/" className="nav-link">Dashboard</Link></li>
            <li><Link to="/graph" className="nav-link">Dependency Graph</Link></li>
            <li><Link to="/ingest" className="nav-link">Document Ingestion</Link></li>
          </ul>
          
          <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
            v1.0.0-beta • Enterprise Engine
          </div>
        </nav>
        <main style={{ flex: 1, padding: '32px 32px 32px 16px', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/graph" element={<GraphView />} />
            <Route path="/ingest" element={<DocumentUpload />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
