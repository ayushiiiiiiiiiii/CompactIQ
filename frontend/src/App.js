import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import GraphView from './pages/GraphView';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
        <nav style={{ width: '250px', backgroundColor: '#0076CE', color: 'white', padding: '20px' }}>
          <h2>Compliance Engine</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ margin: '15px 0' }}><Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link></li>
            <li style={{ margin: '15px 0' }}><Link to="/graph" style={{ color: 'white', textDecoration: 'none' }}>Dependency Graph</Link></li>
          </ul>
        </nav>
        <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/graph" element={<GraphView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
