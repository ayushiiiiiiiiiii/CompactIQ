import React, { useState, useEffect } from 'react';
import { submitInventory, getCompliance } from '../api';
import { ShieldAlert, CheckCircle, Monitor, ShieldCheck, Cpu } from 'lucide-react';

const Dashboard = () => {
    const [compliance, setCompliance] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Wait for explicit scan
    }, []);

    const scanAndSubmit = async () => {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        try {
            if (window.electron && window.electron.scanSystem) {
                const inventory = await window.electron.scanSystem();
                const deviceId = inventory.os.hostname || "UNKNOWN-DEVICE";
                const result = await submitInventory(deviceId, inventory.os, inventory.components);
                localStorage.setItem('scannedDeviceId', deviceId);
                setCompliance(result);
            } else {
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
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700' }}>Endpoint Dashboard</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Real-time hardware & software compliance validation.</p>
                </div>
                <button 
                    onClick={scanAndSubmit} 
                    disabled={loading}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Monitor size={18} />
                    {loading ? "Scanning Environment..." : "Run Validation Check"}
                </button>
            </div>

            {compliance && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease' }}>
                    {/* Score Overview */}
                    <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px' }}>
                        <div>
                            <h2 style={{ margin: '0 0 12px 0', fontSize: '18px', color: 'var(--text-secondary)' }}>Overall Compliance Score</h2>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                <span style={{ fontSize: '48px', fontWeight: '800', color: compliance.status === 'COMPLIANT' ? 'var(--success-text)' : 'var(--error-text)' }}>
                                    {compliance.compliance_score}
                                </span>
                                <span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>/ 100</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '30px', backgroundColor: compliance.status === 'COMPLIANT' ? 'var(--success-bg)' : 'var(--error-bg)', color: compliance.status === 'COMPLIANT' ? 'var(--success-text)' : 'var(--error-text)', border: `1px solid ${compliance.status === 'COMPLIANT' ? 'var(--success-border)' : 'var(--error-border)'}` }}>
                                {compliance.status === 'COMPLIANT' ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                                <span style={{ fontWeight: '600', letterSpacing: '0.5px' }}>{compliance.status}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* System Inventory */}
                    {compliance.os_name && (
                        <div className="glass-card">
                            <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Cpu size={20} color="var(--text-secondary)" /> 
                                Scanned System Inventory
                            </h3>
                            <div style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--card-border)' }}>
                                <strong>Operating System:</strong> {compliance.os_name} (Version: {compliance.os_version})
                            </div>
                            
                            {compliance.components && compliance.components.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                                    {compliance.components.map((comp, idx) => (
                                        <div key={idx} style={{ padding: '16px', border: '1px solid var(--card-border)', borderRadius: '8px', backgroundColor: 'var(--bg-color)' }}>
                                            <strong style={{ color: 'var(--info-text)', fontSize: '16px', display: 'block', marginBottom: '8px' }}>{comp.type}</strong>
                                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Vendor:</span> <span style={{ color: 'var(--text-primary)' }}>{comp.vendor}</span></div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Version:</span> <span style={{ color: 'var(--text-primary)' }}>{comp.version}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Violations & Remediation */}
                    {compliance.violations_count > 0 ? (
                        <div className="glass-card">
                            <h3 style={{ margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error-text)' }}>
                                <ShieldAlert size={20} />
                                Active Violations ({compliance.violations_count})
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                                {compliance.violations.map((v, i) => (
                                    <div key={i} style={{ borderLeft: '4px solid var(--error-border)', padding: '16px', backgroundColor: 'var(--error-bg)', borderRadius: '0 8px 8px 0' }}>
                                        <strong style={{ color: 'var(--error-text)', fontSize: '16px', display: 'block', marginBottom: '8px' }}>{v.source_component} ⚡ {v.target_component}</strong>
                                        <p style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', lineHeight: '1.5' }}>{v.root_cause_explanation}</p>
                                        <small style={{ color: 'var(--text-secondary)' }}>Source: {v.source_document}</small>
                                    </div>
                                ))}
                            </div>
                            
                            {compliance.remediation && (
                                <div style={{ padding: '24px', backgroundColor: 'var(--info-bg)', borderRadius: '8px', borderLeft: '4px solid var(--info-border)' }}>
                                    <h4 style={{ color: 'var(--info-text)', margin: '0 0 12px 0', fontSize: '18px' }}>Recommended Safe Remediation</h4>
                                    <p style={{ fontWeight: '500', color: 'var(--text-primary)', marginBottom: '20px' }}>{compliance.remediation.recommended_action}</p>
                                    
                                    <div style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--terminal-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)' }}>
                                        <div style={{ backgroundColor: 'var(--terminal-header)', padding: '10px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
                                            <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>auto-remediate.ps1</span>
                                        </div>
                                        <pre style={{ margin: 0, padding: '20px', color: 'var(--terminal-text)', fontSize: '14px', lineHeight: '1.6', overflowX: 'auto' }}>
                                            {compliance.remediation.simulated_script?.split('\n').map((line, i) => {
                                                const isComment = line.trim().startsWith('#');
                                                const isCommand = line.includes('Write-Host') || line.includes('Invoke-WebRequest') || line.includes('Start-Process');
                                                return (
                                                    <div key={i} style={{ display: 'flex' }}>
                                                        <span style={{ width: '32px', color: 'var(--text-secondary)', textAlign: 'right', paddingRight: '16px', userSelect: 'none', borderRight: '1px solid var(--card-border)', marginRight: '16px' }}>{i + 1}</span>
                                                        <span style={{ color: isComment ? '#8b949e' : isCommand ? '#38bdf8' : 'var(--terminal-text)', fontStyle: isComment ? 'italic' : 'normal', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
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
                        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '24px', backgroundColor: 'var(--success-bg)', borderLeft: '4px solid var(--success-border)' }}>
                            <CheckCircle size={32} color="var(--success-text)" />
                            <div>
                                <h3 style={{ margin: '0 0 4px 0', color: 'var(--success-text)' }}>System is fully compliant!</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No vulnerabilities or incompatibilities detected across the dependency graph.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
