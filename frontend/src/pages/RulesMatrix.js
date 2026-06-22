import React, { useState, useEffect } from 'react';
import { getGlobalRules } from '../api/endpoints';
import { Table, ShieldAlert, ShieldCheck, Database, HelpCircle } from 'lucide-react';

const RulesMatrix = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const data = await getGlobalRules();
                if (data && data.rules) {
                    setRules(data.rules);
                }
            } catch (error) {
                console.error("Failed to fetch rules:", error);
            }
            setLoading(false);
        };
        
        fetchRules();
    }, []);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Database size={28} color="#3b82f6" />
                        Global Compatibility Matrix
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Detailed data table of all AI-extracted rules from ingested release notes.</p>
                </div>
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--card-border)', background: 'var(--bg-color)', display: 'flex', justifyContent: 'space-between' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Table size={18} />
                        Extracted Rules Database ({rules.length} total)
                    </h3>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)', fontWeight: '600' }}>Source Component</th>
                                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)', fontWeight: '600' }}>Relation</th>
                                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)', fontWeight: '600' }}>Target Constraint</th>
                                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)', fontWeight: '600' }}>Confidence</th>
                                <th style={{ padding: '16px 24px', borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)', fontWeight: '600' }}>Source Document</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading matrix data...</td>
                                </tr>
                            ) : rules.length > 0 ? (
                                rules.map((rule, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.05)' } }}>
                                        <td style={{ padding: '16px 24px', fontWeight: '500' }}>{rule.source_component}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ 
                                                display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                                                backgroundColor: rule.relation === 'REQUIRES' ? 'var(--info-bg)' : 'var(--error-bg)',
                                                color: rule.relation === 'REQUIRES' ? 'var(--info-text)' : 'var(--error-text)',
                                                border: `1px solid ${rule.relation === 'REQUIRES' ? 'var(--info-border)' : 'var(--error-border)'}`
                                            }}>
                                                {rule.relation === 'REQUIRES' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                                {rule.relation}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{rule.target_component}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '60px', height: '6px', background: 'var(--card-border)', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${rule.confidence}%`, height: '100%', background: rule.confidence > 90 ? '#10b981' : rule.confidence > 70 ? '#f59e0b' : '#ef4444' }}></div>
                                                </div>
                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{rule.confidence}%</span>
                                                {rule.ambiguous && <HelpCircle size={14} color="#f59e0b" title="Extraction was marked as ambiguous by AI" />}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>{rule.source_document}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No rules extracted yet. Please upload a document in the Ingestion Engine.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <style>
                {`
                tr:hover {
                    background-color: rgba(255, 255, 255, 0.03);
                }
                `}
            </style>
        </div>
    );
};

export default RulesMatrix;
