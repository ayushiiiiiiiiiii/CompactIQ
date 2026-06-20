import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';

const ComponentModal = () => {
    const { isModalOpen, setIsModalOpen, selectedComponent, complianceResult } = useContext(AppContext);

    if (!isModalOpen || !selectedComponent) return null;

    // selectedComponent should be the exact `id` from graph nodes or component name
    // Let's find the corresponding node data in the graphData
    const node = selectedComponent.data || { label: selectedComponent.id, status: 'Unknown' };
    const isCompliant = node.status === 'Compliant';
    const isWarning = node.status === 'Warning';
    const isMissing = node.status === 'Missing';
    const isRed = !isCompliant && !isWarning && !isMissing;

    // Find any violations tied to this component
    let violations = [];
    if (complianceResult && complianceResult.violations) {
        violations = complianceResult.violations.filter(v => 
            v.source_component === selectedComponent.id || v.target_component === selectedComponent.id
        );
    }

    const badgeColor = isCompliant ? '#10b981' : isWarning ? '#f59e0b' : isMissing ? '#64748b' : '#ef4444';
    const badgeBg = isCompliant ? '#d1fae5' : isWarning ? '#fef3c7' : isMissing ? '#f1f5f9' : '#fee2e2';
    
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 9999, animation: 'fadeIn 0.2s ease-in'
        }}>
            <div className="glass-card" style={{
                width: '600px', maxWidth: '90%', maxHeight: '85vh',
                borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                {/* Header */}
                <div style={{ padding: '20px', borderBottom: `4px solid ${badgeColor}`, backgroundColor: 'var(--terminal-header)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '24px' }}>{node.componentName || selectedComponent.id}</h2>
                            <span style={{ backgroundColor: badgeBg, color: badgeColor, padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                {node.status}
                            </span>
                        </div>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Version: <strong style={{ color: '#334155' }}>{node.version || 'Unknown'}</strong></p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8', padding: '0 5px' }}
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                    
                    {violations.length > 0 ? (
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: 'var(--text-primary)', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>Detected Conflicts & Violations</h3>
                            {violations.map((v, idx) => (
                                <div key={idx} style={{ marginBottom: '15px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #fee2e2', borderRadius: '8px', padding: '15px' }}>
                                    <h4 style={{ margin: '0 0 8px 0', color: '#ef4444', fontSize: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                        {v.what_failed || v.root_cause_explanation}
                                        <span style={{ fontSize: '12px', backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>{v.severity} Risk</span>
                                    </h4>
                                    
                                    <div style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '10px' }}>
                                        <strong>Root Cause:</strong> {v.why_failed || v.root_cause_explanation}
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                                        <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                            <strong style={{ color: '#ef4444', display: 'block', marginBottom: '4px' }}>Business Impact</strong>
                                            <span style={{ color: 'var(--text-secondary)' }}>{v.business_impact || 'Degraded performance or security.'}</span>
                                        </div>
                                        <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                            <strong style={{ color: '#ef4444', display: 'block', marginBottom: '4px' }}>Required Fix</strong>
                                            <span style={{ color: 'var(--text-secondary)' }}>{v.recommended_action || 'Update component.'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '30px', textAlign: 'center', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px dashed #bbf7d0', color: '#166534', marginBottom: '20px' }}>
                            <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
                            <h3 style={{ margin: '0 0 5px 0' }}>Component is Healthy</h3>
                            <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>No compatibility issues or policy violations were detected for this component.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '15px 20px', backgroundColor: 'var(--terminal-header)', borderTop: '1px solid var(--card-border)', textAlign: 'right' }}>
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        style={{ backgroundColor: '#0076CE', color: 'white', border: 'none', padding: '8px 24px', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComponentModal;
