import React, { useContext, useState, useEffect } from 'react';
import ReactFlow, { Background, Controls } from 'react-flow-renderer';
import { AppContext } from '../context/AppContext';
import ComponentModal from '../components/ComponentModal';
import { Link } from 'react-router-dom';
import { getCompliance } from '../api';

const GraphView = ({ isGlobal }) => {
    const { graphData, setSelectedComponent, setIsModalOpen } = useContext(AppContext);
    const [adminGraphData, setAdminGraphData] = useState(null);
    const [adminLoading, setAdminLoading] = useState(false);
    const [adminError, setAdminError] = useState(null);

    // In admin/global mode, fetch the latest device's graph independently
    useEffect(() => {
        if (!isGlobal) return;
        setAdminLoading(true);
        getCompliance('latest')
            .then(data => {
                if (data && data.graph_elements) {
                    setAdminGraphData(data.graph_elements);
                } else {
                    setAdminError('No device data ingested yet. Submit a scan from the Client view first.');
                }
            })
            .catch(() => {
                setAdminError('No device scanned yet. Use the Client view to run a scan first.');
            })
            .finally(() => setAdminLoading(false));
    }, [isGlobal]);

    const activeGraphData = isGlobal ? adminGraphData : graphData;

    if (isGlobal && adminLoading) {
        return <div style={{ padding: '40px', color: '#64748b', textAlign: 'center' }}>Loading global knowledge graph...</div>;
    }

    if (isGlobal && adminError) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <h3 style={{ color: '#334155' }}>Global Graph</h3>
                <p style={{ color: '#64748b' }}>{adminError}</p>
            </div>
        );
    }

    if (!activeGraphData || !activeGraphData.elements) {
        return <div style={{ padding: '20px', color: '#64748b' }}>No graph data available. Please ensure the scan has completed.</div>;
    }

    const initialNodes = activeGraphData.elements.filter(el => !el.source && !el.target);
    const initialEdges = activeGraphData.elements.filter(el => el.source && el.target);

    const openModalFor = (nodeId) => {
        const node = initialNodes.find(n => n.id === nodeId);
        if (node) {
            setSelectedComponent(node);
            setIsModalOpen(true);
        }
    };

    const backLink = isGlobal ? '/admin/ingest' : '/client/scan';
    const backLabel = isGlobal ? '← Back to Admin' : '← Back to Dashboard';

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.5s ease-in' }}>
            <ComponentModal />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: '0 0 5px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Link to={backLink} style={{ color: '#0076CE', textDecoration: 'none', fontSize: '16px' }}>{backLabel}</Link>
                        {isGlobal ? 'Global Knowledge Graph' : 'Knowledge Graph Explorer'}
                    </h1>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                        {isGlobal ? 'System-wide component graph from latest device scan.' : 'Visualizing active components and their dependencies.'}
                    </p>
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', backgroundColor: '#f8fafc', padding: '5px 10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <strong>{initialNodes.length}</strong> Nodes | <strong>{initialEdges.length}</strong> Edges
                </div>
            </div>

            <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden', position: 'relative' }}>
                <ReactFlow 
                    nodes={initialNodes} 
                    edges={initialEdges} 
                    fitView 
                    style={{ width: '100%', height: '100%' }}
                    onNodeClick={(e, node) => openModalFor(node.id)}
                >
                    <Background color="#cbd5e1" gap={16} />
                    <Controls />
                    
                    {/* Legend Panel */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontSize: '12px' }}>
                        <strong style={{ color: '#1e293b', display: 'block', marginBottom: '10px' }}>Graph Legend</strong>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ color: '#475569', marginBottom: '5px', fontWeight: 'bold' }}>Component Health</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#f0fdf4', border: '2px solid #10b981', borderRadius: '2px' }}></div>
                                <span style={{ color: '#334155' }}>Healthy / Compliant</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '2px' }}></div>
                                <span style={{ color: '#334155' }}>Warning / Needs Attention</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#fef2f2', border: '2px solid #ef4444', borderRadius: '2px' }}></div>
                                <span style={{ color: '#334155' }}>Violation Present</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#fff', border: '2px dashed #f59e0b', borderRadius: '2px' }}></div>
                                <span style={{ color: '#334155' }}>Missing Required Component</span>
                            </div>
                        </div>

                        <div>
                            <div style={{ color: '#475569', marginBottom: '5px', fontWeight: 'bold' }}>Edge Relationships</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '20px', height: '2px', backgroundColor: '#cbd5e1' }}></div>
                                <span style={{ color: '#334155' }}>HAS_COMPONENT</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '20px', height: '2px', backgroundColor: '#f59e0b' }}></div>
                                <span style={{ color: '#334155' }}>REQUIRES / DEPENDS_ON</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '20px', height: '2px', backgroundColor: '#ef4444' }}></div>
                                <span style={{ color: '#334155' }}>INCOMPATIBLE / CONFLICTS</span>
                            </div>
                        </div>
                    </div>
                </ReactFlow>
            </div>
        </div>
    );
};

export default GraphView;
