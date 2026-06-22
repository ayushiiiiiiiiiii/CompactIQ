import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import ReactFlow, { Background, Controls } from 'react-flow-renderer';
import { Link } from 'react-router-dom';
import ComponentModal from '../components/ui/ComponentModal';

const Dashboard = () => {
    const { complianceResult, graphData, setSelectedComponent, setIsModalOpen, setLoadingStatus, setPhaseIndex } = useContext(AppContext);

    if (!complianceResult) {
        return <div style={{ padding: '20px' }}>No scan data available.</div>;
    }

    let nodes = [];
    let edges = [];
    if (graphData && graphData.elements) {
        nodes = graphData.elements.filter(el => !el.source && !el.target);
        edges = graphData.elements.filter(el => el.source && el.target);
    }

    const isCompliant = complianceResult.status === 'COMPLIANT';

    // Helper for Explorer Tiles
    const openModalFor = (nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            setSelectedComponent(node);
            setIsModalOpen(true);
        } else {
            // Fallback if node not in graph
            setSelectedComponent({ id: nodeId, data: { label: nodeId, status: 'Unknown' } });
            setIsModalOpen(true);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <ComponentModal />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--card-border)', paddingBottom: '15px', marginBottom: '20px' }}>
                <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Endpoint Overview</h1>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Last Scan: <strong style={{ color: 'var(--text-primary)' }}>{complianceResult.last_scanned ? new Date(complianceResult.last_scanned).toLocaleString() : 'Just now'}</strong></div>
                        <button 
                            onClick={() => {
                                window.hasStartedScan = false;
                                setPhaseIndex(0);
                                setLoadingStatus(true);
                            }}
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '12px' }}>
                            Rescan System
                        </button>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Scan Status: <strong style={{ color: '#0076CE' }}>{complianceResult.scan_status || 'COMPLETED'}</strong></div>
                </div>
            </div>

            {/* Score & System Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
                {/* Score Card */}
                <div className="glass-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '18px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Compliance Score</h2>
                    <div style={{ fontSize: '64px', fontWeight: 'bold', color: isCompliant ? '#10b981' : '#f59e0b', lineHeight: '1' }}>
                        {complianceResult.compliance_score}
                    </div>
                    <div style={{ marginTop: '10px', padding: '6px 16px', borderRadius: '20px', backgroundColor: isCompliant ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: isCompliant ? '#10b981' : '#f59e0b', fontWeight: 'bold', fontSize: '14px' }}>
                        {complianceResult.status}
                    </div>
                </div>

                {/* System Overview Card */}
                <div className="glass-card" style={{ padding: '25px' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>System Overview</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Operating System</span>
                            <div style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: '500' }}>{complianceResult.os_name || 'Unknown'}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>OS Version</span>
                            <div style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: '500' }}>{complianceResult.os_version || 'Unknown'}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Device ID</span>
                            <div style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: '500' }}>{complianceResult.device_id}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tracked Components</span>
                            <div style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: '500' }}>{complianceResult.components ? complianceResult.components.length : 0} components</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Section: Risks & Graph Snapshot */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="glass-card" style={{ padding: '25px' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px' }}>
                        Compliance Explanation Engine 
                        <span style={{ marginLeft: '10px', backgroundColor: complianceResult.violations_count > 0 ? '#ef4444' : '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                            {complianceResult.violations_count} detected
                        </span>
                    </h3>
                    
                    {complianceResult.violations_count > 0 ? (
                        <div>
                            {complianceResult.violations.map((v, i) => (
                                <div key={i} style={{ border: '1px solid var(--error-border)', padding: '15px', backgroundColor: 'var(--error-bg)', margin: '15px 0', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginRight: '10px' }}>{v.severity || "CRITICAL"}</span>
                                        <strong style={{ fontSize: '16px', color: 'var(--error-text)' }}>{v.what_failed || v.root_cause_explanation}</strong>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                        <div><strong style={{color: 'var(--text-primary)'}}>Cause:</strong> {v.why_failed || v.root_cause_explanation}</div>
                                        <div><strong style={{color: 'var(--text-primary)'}}>Affected Components:</strong> {(v.affected_components || [v.source_component, v.target_component]).join(", ")}</div>
                                        <div><strong style={{color: 'var(--text-primary)'}}>Business Impact:</strong> {v.business_impact || 'Degraded Performance'}</div>
                                    </div>
                                    <div style={{ backgroundColor: 'var(--info-bg)', padding: '10px', borderRadius: '6px', border: '1px solid var(--info-border)', fontSize: '14px' }}>
                                        <strong style={{color: 'var(--info-text)'}}>Recommended Resolution:</strong> <span style={{color: 'var(--info-text)'}}>{v.recommended_action || "Update component."}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '20px', backgroundColor: 'var(--success-bg)', borderRadius: '8px', border: '1px dashed var(--success-border)', textAlign: 'center', color: 'var(--success-text)' }}>
                            No compatibility risks or policy violations detected. System is healthy.
                        </div>
                    )}
                </div>

                {/* Graph Snapshot */}
                <div className="glass-card" style={{ padding: '25px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', marginBottom: '15px' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Knowledge Graph</h3>
                        <Link to="/client/graph" style={{ fontSize: '12px', color: '#0076CE', textDecoration: 'none', fontWeight: '500', backgroundColor: '#f0f9ff', padding: '4px 10px', borderRadius: '12px' }}>Explore &rarr;</Link>
                    </div>
                    <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--card-border)', minHeight: '300px', position: 'relative' }}>
                        {nodes.length > 0 ? (
                            <ReactFlow 
                                nodes={nodes} 
                                edges={edges} 
                                fitView 
                                style={{ width: '100%', height: '100%' }}
                                onNodeClick={(e, node) => openModalFor(node.id)}
                            >
                                <Background color="#cbd5e1" gap={12} size={1} />
                            </ReactFlow>
                        ) : (
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-secondary)', fontSize: '14px' }}>Graph data unavailable</div>
                        )}
                    </div>
                </div>
            </div>

            {/* FEATURE 3: Remediation Roadmap Panel */}
            {complianceResult.remediation && complianceResult.remediation.roadmap && (
                <div style={{ padding: '25px', backgroundColor: 'var(--terminal-bg)', borderRadius: '12px', boxShadow: 'var(--shadow)', color: 'var(--terminal-text)', marginBottom: '40px' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: 'var(--terminal-text)', borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>🛠</span> Recommended Resolution Path
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingTop: '15px', paddingBottom: '15px' }}>
                        {complianceResult.remediation.roadmap.map((step, idx) => (
                            <React.Fragment key={idx}>
                                <div style={{ 
                                    minWidth: '220px', backgroundColor: 'var(--terminal-header)', border: '1px solid var(--card-border)', 
                                    borderRadius: '8px', padding: '15px', position: 'relative'
                                }}>
                                    <div style={{ position: 'absolute', top: '-10px', left: '15px', backgroundColor: '#0076CE', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                        Step {idx + 1}
                                    </div>
                                    <p style={{ margin: '10px 0 0 0', fontSize: '15px', color: 'var(--terminal-text)', lineHeight: '1.5' }}>{step}</p>
                                </div>
                                {idx < complianceResult.remediation.roadmap.length - 1 && (
                                    <div style={{ color: '#0076CE', fontSize: '24px', margin: '0 15px' }}>&rarr;</div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
