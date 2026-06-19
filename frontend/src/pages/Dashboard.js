import React, { useState, useEffect } from 'react';
import { submitInventory, getCompliance } from '../api';

const Dashboard = () => {
    const [compliance, setCompliance] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchInitialCompliance = async () => {
            try {
                const result = await getCompliance("DEVICE-XYZ-123");
                if (result) {
                    setCompliance(result);
                }
            } catch (error) {
                console.log("Device record not found yet in database.");
            }
        };
        fetchInitialCompliance();
    }, []);

    const scanAndSubmit = async () => {
        setLoading(true);
        // Simulate visual scanning feedback
        await new Promise((resolve) => setTimeout(resolve, 1500));
        try {
            if (window.electron && window.electron.scanSystem) {
                // Electron app: execute real PowerShell system scan and POST to backend
                const inventory = await window.electron.scanSystem();
                const result = await submitInventory("DEVICE-XYZ-123", inventory.os, inventory.components);
                setCompliance(result);
            } else {
                // Web Browser: try to fetch the saved real system configuration from the database
                try {
                    const result = await getCompliance("DEVICE-XYZ-123");
                    setCompliance(result);
                } catch (err) {
                    // Fallback mock submission if the DB is empty (404)
                    const mockInventory = {
                        os: { name: "Windows 11", version: "10.0.22621" },
                        components: [
                          { type: "BIOS", vendor: "Dell", version: "1.14.3" },
                          { type: "SecurityAgent", vendor: "CrowdStrike", version: "7.17" },
                          { type: "Intel_NIC", vendor: "Intel", version: "22.0"}
                        ]
                    };
                    const res = await submitInventory("DEVICE-XYZ-123", mockInventory.os, mockInventory.components);
                    setCompliance(res);
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
                                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '4px' }}>
                                        <h4>Recommended Safe Remediation</h4>
                                        <p>{compliance.remediation.recommended_action}</p>
                                        <pre style={{ backgroundColor: '#2d3748', color: '#a0aec0', padding: '10px' }}>
                                            {compliance.remediation.simulated_script}
                                        </pre>
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
