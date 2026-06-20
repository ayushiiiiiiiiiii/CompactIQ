import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, Outlet } from 'react-router-dom';
import 'react-flow-renderer/dist/style.css';
import 'react-flow-renderer/dist/theme-default.css';
import './index.css';
import Dashboard from './pages/Dashboard';
import GraphView from './pages/GraphView';
import DocumentUpload from './pages/DocumentUpload';
import LandingPage from './pages/LandingPage';
import RulesMatrix from './pages/RulesMatrix';
import { Sun, Moon, Database, UploadCloud, Monitor, Network, Table } from 'lucide-react';

const AdminLayout = ({ theme, toggleTheme }) => {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', transition: 'all 0.3s' }}>
      <nav className="glass-panel" style={{ width: '260px', margin: '16px', padding: '24px', display: 'flex', flexDirection: 'column', background: 'var(--sidebar-bg)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 style={{ margin: 0, color: 'var(--sidebar-text)', fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            <span style={{ color: '#38bdf8' }}>AI</span>Admin
          </h2>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><Link to="/admin/ingest" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><UploadCloud size={18} /> Document Ingestion</Link></li>
          <li><Link to="/admin/graph" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Network size={18} /> Global Graph</Link></li>
          <li><Link to="/admin/rules" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Table size={18} /> Rules Matrix</Link></li>
        </ul>
        
        <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
          <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>← Change Role</Link>
          v1.0.0-beta • Enterprise Engine
        </div>
      </nav>
      <main style={{ flex: 1, padding: '32px 32px 32px 16px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

const ClientLayout = ({ theme, toggleTheme }) => {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', transition: 'all 0.3s' }}>
      <nav className="glass-panel" style={{ width: '260px', margin: '16px', padding: '24px', display: 'flex', flexDirection: 'column', background: 'var(--sidebar-bg)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h2 style={{ margin: 0, color: 'var(--sidebar-text)', fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            <span style={{ color: '#10b981' }}>AI</span>Agent
          </h2>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><Link to="/client/scan" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Monitor size={18} /> My Device Scan</Link></li>
          <li><Link to="/client/graph" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Network size={18} /> Local Graph</Link></li>
        </ul>
        
        <div style={{ marginTop: 'auto', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
          <Link to="/" style={{ color: '#10b981', textDecoration: 'none', display: 'block', marginBottom: '8px' }}>← Change Role</Link>
          v1.0.0-beta • Endpoint Agent
        </div>
      </nav>
      <main style={{ flex: 1, padding: '32px 32px 32px 16px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

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
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        <Route path="/admin" element={<AdminLayout theme={theme} toggleTheme={toggleTheme} />}>
          <Route path="ingest" element={<DocumentUpload />} />
          <Route path="graph" element={<GraphView isGlobal={true} />} />
          <Route path="rules" element={<RulesMatrix />} />
        </Route>
        
        <Route path="/client" element={<ClientLayout theme={theme} toggleTheme={toggleTheme} />}>
          <Route path="scan" element={<Dashboard />} />
          <Route path="graph" element={<GraphView isGlobal={false} />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
