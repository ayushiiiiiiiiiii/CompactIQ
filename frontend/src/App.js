import React, { useContext, useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import 'react-flow-renderer/dist/style.css';
import 'react-flow-renderer/dist/theme-default.css';
import Dashboard from './pages/Dashboard';
import GraphView from './pages/GraphView';
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

function App() {
    const { 
        loadingStatus, setLoadingStatus, 
        phaseIndex, setPhaseIndex, 
        setComplianceResult, setGraphData 
    } = useContext(AppContext);

    const [scanError, setScanError] = useState(null);
    const hasStarted = useRef(false);

    useEffect(() => {
        // Prevent double execution in React Strict Mode
        if (window.hasStartedScan) return;
        window.hasStartedScan = true;

        const runAutoScan = async () => {
            try {
                console.log("[CompactIQ] Application Started");

                // Splash Screen Phase (with Fail-Safe Timeout)
                await Promise.race([
                    new Promise(r => setTimeout(r, 1500)),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Splash Timeout")), 3000))
                ]).catch(e => console.warn("[CompactIQ] Splash timeout enforced:", e));

                console.log("[CompactIQ] Scan Started");
                setPhaseIndex(1);
                await new Promise(r => setTimeout(r, 1000));

                console.log("[CompactIQ] Collecting Metadata");
                setPhaseIndex(2);
                let inventory = null;
                if (window.electron && window.electron.scanSystem) {
                    inventory = await window.electron.scanSystem();
                    console.log("[CompactIQ] Inventory Received", inventory);
                } else {
                    await new Promise(r => setTimeout(r, 1500));
                    console.log("[CompactIQ] Mock Inventory Delay Completed");
                }

                console.log("[CompactIQ] Analyzing Dependencies");
                setPhaseIndex(3);
                await new Promise(r => setTimeout(r, 1000));

                console.log("[CompactIQ] Building Knowledge Graph");
                setPhaseIndex(4);
                await new Promise(r => setTimeout(r, 1000));

                console.log("[CompactIQ] API Request Started (Compliance Checks)");
                setPhaseIndex(5);
                
                let result;
                if (window.electron && window.electron.scanSystem && inventory) {
                    const deviceId = inventory.os.hostname || "UNKNOWN-DEVICE";
                    result = await submitInventory(deviceId, inventory.os, inventory.components);
                    localStorage.setItem('scannedDeviceId', deviceId);
                } else {
                    result = await getCompliance("latest");
                }
                
                console.log("[CompactIQ] API Response Received", result);
                
                console.log("[CompactIQ] Generating Recommendations");
                setPhaseIndex(6);
                await new Promise(r => setTimeout(r, 1200));
                
                console.log("[CompactIQ] Compliance Processed. Dashboard Ready.");
                setComplianceResult(result);
                if (result && result.graph_elements) {
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
                console.log("[CompactIQ] Loading Cleared");
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
                    <button 
                        onClick={() => window.location.reload()} 
                        style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Retry Scan
                    </button>
                </div>
            </div>
        );
    }

    if (loadingStatus) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f1f5f9' }}>
                {phaseIndex === 0 ? (
                    <div style={{ textAlign: 'center', animation: 'fadeIn 1s ease-in' }}>
                        <h1 style={{ color: '#0076CE', fontSize: '56px', marginBottom: '10px', letterSpacing: '-1px' }}>CompactIQ</h1>
                        <p style={{ color: '#64748b', fontSize: '20px', fontWeight: '500' }}>Enterprise Compatibility Intelligence Platform</p>
                        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '20px' }}>Loading enterprise services...</p>
                        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '40px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '450px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                        <div style={{ marginBottom: '25px' }}>
                            <div className="spinner" style={{ width: '48px', height: '48px', border: '4px solid #cbd5e1', borderTop: '4px solid #0076CE', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                        </div>
                        <h3 style={{ color: '#334155', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>{LOADING_PHASES[phaseIndex]}</h3>
                        <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                            <div style={{ width: `${(phaseIndex / (LOADING_PHASES.length - 1)) * 100}%`, backgroundColor: '#0076CE', height: '100%', borderRadius: '6px', transition: 'width 0.6s ease-in-out' }}></div>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '15px' }}>Please do not close the application.</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Router>
            <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f8fafc' }}>
                <nav style={{ width: '250px', backgroundColor: '#0f172a', color: 'white', padding: '20px', boxShadow: '2px 0 5px rgba(0,0,0,0.1)', zIndex: 10 }}>
                    <h2 style={{ color: '#38bdf8', letterSpacing: '-0.5px' }}>CompactIQ</h2>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '30px' }}>Enterprise Edition</p>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ margin: '15px 0' }}>
                            <Link to="/" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '10px' }}>📊</span> Dashboard
                            </Link>
                        </li>
                        <li style={{ margin: '15px 0' }}>
                            <Link to="/graph" style={{ color: '#e2e8f0', textDecoration: 'none', fontSize: '16px', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '10px' }}>🕸️</span> Knowledge Graph
                            </Link>
                        </li>
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
