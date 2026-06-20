import React, { useState, useEffect } from 'react';
import { submitInventory, getCompliance } from '../api';

const Dashboard = () => {
    const [compliance, setCompliance] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // We removed the auto-fetching so the dashboard loads completely blank
        // and waits for the user to explicitly click 'Run Validation Check'.
    }, []);

    const scanAndSubmit = async () => {
        setLoading(true);
        // Simulate visual scanning feedback
        await new Promise((resolve) => setTimeout(resolve, 1500));
        try {
            if (window.electron && window.electron.scanSystem) {
                // Electron app: execute real PowerShell system scan and POST to backend
                const inventory = await window.electron.scanSystem();
                const deviceId = inventory.os.hostname || "UNKNOWN-DEVICE";
                const result = await submitInventory(deviceId, inventory.os, inventory.components);
                localStorage.setItem('scannedDeviceId', deviceId);
                setCompliance(result);
            } else {
                // Web Browser: try to fetch the saved real system configuration from the database
                try {
                    const result = await getCompliance("latest");
                    setCompliance(result);
                } catch (err) {
                    alert("Please run this app from the Electron desktop client to perform actual system scanning. No previous scan found in DB.");
                }
            }
        } catch (error) {
            console.error("Scan failed", error);
        }
        setLoading(false);
    };

    return (
        <div>
            <h1>Endpoint Dashboard</h1>
            <button 
                onClick={scanAndSubmit} 
                disabled={loading}
                style={{ padding: '10px 20px', backgroundColor: '#0076CE', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                {loading ? "Scanning..." : "Run Validation Check"}
            </button>

            {compliance && (
                <div style={{ marginTop: '30px' }}>
                    <div style={{ padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h2>Compliance Score: {compliance.compliance_score} / 100</h2>
                        <h3 style={{ color: compliance.status === 'COMPLIANT' ? 'green' : 'red' }}>Status: {compliance.status}</h3>
                        
                        {/* System Inventory Details Section */}
                        {compliance.os_name && (
                            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                <h3>Scanned System Inventory</h3>
                                <p style={{ fontSize: '15px' }}><strong>Operating System:</strong> {compliance.os_name} (Version: {compliance.os_version})</p>
                                
                                {compliance.components && compliance.components.length > 0 && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginTop: '15px' }}>
                                        {compliance.components.map((comp, idx) => (
                                            <div key={idx} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc' }}>
                                                <strong style={{ color: '#0076CE', fontSize: '16px' }}>{comp.type}</strong>
                                                <div style={{ marginTop: '5px', fontSize: '14px', color: '#475569' }}>
                                                    <div><strong>Vendor:</strong> {comp.vendor}</div>
                                                    <div><strong>Version:</strong> {comp.version}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {compliance.violations_count > 0 ? (
                            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                <h4>Violations</h4>
                                {compliance.violations.map((v, i) => (
                                    <div key={i} style={{ borderLeft: '4px solid red', padding: '10px', backgroundColor: '#fff5f5', margin: '10px 0' }}>
                                        <strong>{v.source_component} ⚡ {v.target_component}</strong>
                                        <p>{v.root_cause_explanation}</p>
                                        <small>Source: {v.source_document}</small>
                                    </div>
                                ))}
                                
                                {compliance.remediation && (
                                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '4px', borderLeft: '4px solid #0ea5e9' }}>
                                        <h4 style={{ color: '#0369a1', marginBottom: '10px' }}>Recommended Safe Remediation</h4>
                                        <p style={{ fontWeight: '500', color: '#0f172a', marginBottom: '15px' }}>{compliance.remediation.recommended_action}</p>
                                        
                                        <div style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0d1117', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                            <div style={{ backgroundColor: '#161b22', padding: '8px 12px', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
                                                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#8b949e', fontFamily: 'monospace' }}>auto-remediate.ps1</span>
                                            </div>
                                            <pre style={{ margin: 0, padding: '16px', color: '#c9d1d9', fontSize: '13px', lineHeight: '1.5', overflowX: 'auto' }}>
                                                {compliance.remediation.simulated_script?.split('\n').map((line, i) => {
                                                    const isComment = line.trim().startsWith('#');
                                                    const isCommand = line.includes('Write-Host') || line.includes('Invoke-WebRequest') || line.includes('Start-Process');
                                                    return (
                                                        <div key={i} style={{ display: 'flex' }}>
                                                            <span style={{ width: '24px', color: '#484f58', textAlign: 'right', paddingRight: '12px', userSelect: 'none', borderRight: '1px solid #30363d', marginRight: '12px' }}>{i + 1}</span>
                                                            <span style={{ color: isComment ? '#8b949e' : isCommand ? '#79c0ff' : '#c9d1d9', fontStyle: isComment ? 'italic' : 'normal', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                                                {line}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0fff4', borderRadius: '4px', borderLeft: '4px solid green' }}>
                                <strong>System is fully compliant! No violations detected.</strong>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
