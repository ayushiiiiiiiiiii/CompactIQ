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
import ComponentExplorer from './pages/ComponentExplorer';
import { Sun, Moon, Database, UploadCloud, Monitor, Network, Table } from 'lucide-react';
import { AppContext } from './context/AppContext';
import { submitInventory, getCompliance } from './api';

const LOADING_PHASES = [
    "Initializing CompactIQ Enterprise...",
    "Scanning Device...",
    "Collecting System Metadata...",
    "Analyzing Dependencies...",
    "Building Knowledge Graph...",
    "Running Compliance Checks...",
    "Generating Recommendations..."
];

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
  const { 
      loadingStatus, setLoadingStatus, 
      phaseIndex, setPhaseIndex, 
      setComplianceResult, setGraphData 
  } = React.useContext(AppContext);

  const [scanError, setScanError] = React.useState(null);

  React.useEffect(() => {
      if (window.hasStartedScan) return;
      window.hasStartedScan = true;

      const runAutoScan = async () => {
          try {
              await Promise.race([
                  new Promise(r => setTimeout(r, 1500)),
                  new Promise((_, reject) => setTimeout(() => reject(new Error("Splash Timeout")), 3000))
              ]).catch(() => {});

              setPhaseIndex(1);
              await new Promise(r => setTimeout(r, 1000));

              setPhaseIndex(2);
              let inventory = null;
              if (window.electron && window.electron.scanSystem) {
                  inventory = await window.electron.scanSystem();
              } else {
                  await new Promise(r => setTimeout(r, 1500));
              }

              setPhaseIndex(3);
              await new Promise(r => setTimeout(r, 1000));

              setPhaseIndex(4);
              await new Promise(r => setTimeout(r, 1000));

              setPhaseIndex(5);
              
              let result;
              if (window.electron && window.electron.scanSystem && inventory) {
                  const deviceId = inventory.os.hostname || "UNKNOWN-DEVICE";
                  result = await submitInventory(deviceId, inventory.os, inventory.components);
                  localStorage.setItem('scannedDeviceId', deviceId);
              } else {
                  result = await getCompliance("latest");
              }
              
              setPhaseIndex(6);
              await new Promise(r => setTimeout(r, 1200));
              
              setComplianceResult(result);
              if (result.graph_elements) {
                  setGraphData(result.graph_elements);
              }
          } catch (error) {
              console.error("[CompactIQ] Exact Failure Location:", error);
              let errorMessage = "Unable to contact compliance service.";
              if (error.response && error.response.data && error.response.data.detail) {
                  errorMessage = `Backend Error: ${error.response.data.detail}`;
              } else if (error.message) {
                  errorMessage = error.message;
              }
              setScanError(errorMessage);
          } finally {
              setLoadingStatus(false);
          }
      };

      if (loadingStatus) {
          runAutoScan();
      }
  }, []);

  if (scanError) {
      return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#fef2f2' }}>
              <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #fee2e2', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                  <h2 style={{ color: '#b91c1c', margin: '0 0 15px 0' }}>Validation Failed</h2>
                  <p style={{ color: '#7f1d1d', margin: '0 0 25px 0' }}>{scanError}</p>
                  <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Retry Scan</button>
              </div>
          </div>
      );
  }

  if (loadingStatus) {
      return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a' }}>
              {phaseIndex === 0 ? (
                  <div style={{ textAlign: 'center', animation: 'fadeIn 1s ease-in' }}>
                      <h1 style={{ color: '#10b981', fontSize: '56px', marginBottom: '10px', letterSpacing: '-1px' }}>CompactIQ</h1>
                      <p style={{ color: '#94a3b8', fontSize: '20px', fontWeight: '500' }}>Endpoint Agent Initialization</p>
                      <p style={{ color: '#475569', fontSize: '14px', marginTop: '20px' }}>Loading services...</p>
                      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                  </div>
              ) : (
                  <div className="glass-card" style={{ textAlign: 'center', padding: '40px', width: '450px' }}>
                      <div style={{ marginBottom: '25px' }}>
                          <div className="spinner" style={{ width: '48px', height: '48px', border: '4px solid #334155', borderTop: '4px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                      </div>
                      <h3 style={{ color: '#f8fafc', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>{LOADING_PHASES[phaseIndex]}</h3>
                      <div style={{ width: '100%', backgroundColor: '#1e293b', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                          <div style={{ width: `${(phaseIndex / (LOADING_PHASES.length - 1)) * 100}%`, backgroundColor: '#10b981', height: '100%', borderRadius: '6px', transition: 'width 0.6s ease-in-out' }}></div>
                      </div>
                  </div>
              )}
          </div>
      );
  }

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
          <li><Link to="/client/components" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={18} /> Component Explorer</Link></li>
          <li><Link to="/client/graph" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Network size={18} /> Knowledge Graph</Link></li>
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
          <Route path="components" element={<ComponentExplorer />} />
          <Route path="graph" element={<GraphView isGlobal={false} />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
