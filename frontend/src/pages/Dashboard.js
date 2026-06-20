import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import ReactFlow, { Background, Controls } from 'react-flow-renderer';
import { Link } from 'react-router-dom';
import ComponentModal from '../components/ComponentModal';

const Dashboard = () => {
    const { complianceResult, graphData, setSelectedComponent, setIsModalOpen } = useContext(AppContext);

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                <h1 style={{ margin: 0, color: '#1e293b' }}>Endpoint Overview</h1>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>Last Scan: <strong style={{ color: '#334155' }}>{complianceResult.last_scanned ? new Date(complianceResult.last_scanned).toLocaleString() : 'Just now'}</strong></div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>Scan Status: <strong style={{ color: '#0076CE' }}>{complianceResult.scan_status || 'COMPLETED'}</strong></div>
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
                            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Operating System</span>
                            <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '500' }}>{complianceResult.os_name || 'Unknown'}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>OS Version</span>
                            <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '500' }}>{complianceResult.os_version || 'Unknown'}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Device ID</span>
                            <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '500' }}>{complianceResult.device_id}</div>
                        </div>
                        <div>
                            <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Tracked Components</span>
                            <div style={{ fontSize: '16px', color: '#0f172a', fontWeight: '500' }}>{complianceResult.components ? complianceResult.components.length : 0} components</div>
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
                                <div key={i} style={{ border: '1px solid #fee2e2', padding: '15px', backgroundColor: '#fff', margin: '15px 0', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', marginRight: '10px' }}>{v.severity || "CRITICAL"}</span>
                                        <strong style={{ fontSize: '16px', color: '#7f1d1d' }}>{v.what_failed || v.root_cause_explanation}</strong>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '14px', color: '#475569', marginBottom: '10px' }}>
                                        <div><strong style={{color: '#334155'}}>Cause:</strong> {v.why_failed || v.root_cause_explanation}</div>
                                        <div><strong style={{color: '#334155'}}>Affected Components:</strong> {(v.affected_components || [v.source_component, v.target_component]).join(", ")}</div>
                                        <div><strong style={{color: '#334155'}}>Business Impact:</strong> {v.business_impact || 'Degraded Performance'}</div>
                                    </div>
                                    <div style={{ backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '6px', border: '1px solid #bae6fd', fontSize: '14px' }}>
                                        <strong style={{color: '#0369a1'}}>Recommended Resolution:</strong> <span style={{color: '#0c4a6e'}}>{v.recommended_action || "Update component."}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px dashed #bbf7d0', textAlign: 'center', color: '#166534' }}>
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
                    <div style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', minHeight: '300px', position: 'relative' }}>
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
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#94a3b8', fontSize: '14px' }}>Graph data unavailable</div>
                        )}
                    </div>
                </div>
            </div>

            {/* FEATURE 3: Remediation Roadmap Panel */}
            {complianceResult.remediation && complianceResult.remediation.roadmap && (
                <div style={{ padding: '25px', backgroundColor: '#0f172a', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', color: 'white', marginBottom: '40px' }}>
                    <h3 style={{ margin: '0 0 20px 0', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>🛠</span> Recommended Resolution Path
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', paddingBottom: '15px' }}>
                        {complianceResult.remediation.roadmap.map((step, idx) => (
                            <React.Fragment key={idx}>
                                <div style={{ 
                                    minWidth: '200px', backgroundColor: '#1e293b', border: '1px solid #334155', 
                                    borderRadius: '8px', padding: '15px', position: 'relative'
                                }}>
                                    <div style={{ position: 'absolute', top: '-10px', left: '15px', backgroundColor: '#0076CE', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                                        Step {idx + 1}
                                    </div>
                                    <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#cbd5e1', lineHeight: '1.4' }}>{step}</p>
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
