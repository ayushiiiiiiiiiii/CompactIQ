import React, { useState } from 'react';
import { submitInventory } from '../api';

const Dashboard = () => {
    const [compliance, setCompliance] = useState(null);
    const [loading, setLoading] = useState(false);

    const scanAndSubmit = async () => {
        setLoading(true);
        try {
            // Check if electron is available, otherwise use mock data for browser dev testing
            let inventory;
            if (window.electron && window.electron.scanSystem) {
                inventory = await window.electron.scanSystem();
            } else {
                inventory = {
                    os: { name: "Windows 11", version: "10.0.22621" },
                    components: [
                      { type: "BIOS", vendor: "Dell", version: "1.14.3" },
                      { type: "SecurityAgent", vendor: "CrowdStrike", version: "7.17" },
                      { type: "Intel_NIC", vendor: "Intel", version: "22.0"}
                    ]
                };
            }
            
            const result = await submitInventory("DEVICE-XYZ-123", inventory.os, inventory.components);
            setCompliance(result);
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
                        
                        {compliance.violations_count > 0 && (
                            <div>
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
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
