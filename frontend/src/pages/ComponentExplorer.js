import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import ComponentModal from '../components/ComponentModal';

const ComponentExplorer = () => {
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

    const openModalFor = (nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            setSelectedComponent(node);
            setIsModalOpen(true);
        } else {
            setSelectedComponent({ id: nodeId, data: { label: nodeId, status: 'Unknown' } });
            setIsModalOpen(true);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <ComponentModal />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#1e293b' }}>Component Health Explorer</h1>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px', marginTop: '5px' }}>Detailed inspection of all discovered hardware and software components.</p>
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                    Total Components: <strong style={{ color: '#0076CE' }}>{nodes.filter(n => n.id !== 'endpoint-device').length}</strong>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {nodes.filter(n => n.id !== 'endpoint-device').map((node, i) => {
                    const isNodeCompliant = node.data.status === 'Compliant';
                    const isNodeWarning = node.data.status === 'Warning';
                    const isNodeMissing = node.data.status === 'Missing';
                    const tileColor = isNodeCompliant ? '#10b981' : isNodeWarning ? '#f59e0b' : isNodeMissing ? '#64748b' : '#ef4444';
                    const tileBg = isNodeCompliant ? '#f0fdf4' : isNodeWarning ? '#fffbeb' : isNodeMissing ? '#f8fafc' : '#fef2f2';

                    const dependencyCount = edges.filter(e => e.source === node.id && (e.label === 'REQUIRES' || e.label === 'DEPENDS_ON')).length;
                    
                    return (
                        <div 
                            key={i} 
                            onClick={() => openModalFor(node.id)}
                            style={{ 
                                backgroundColor: 'white', borderRadius: '10px', border: `1px solid ${tileColor}`,
                                padding: '18px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                transition: 'transform 0.2s, box-shadow 0.2s', borderLeftWidth: '5px',
                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '110px'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 10px rgba(0,0,0,0.05)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
                        >
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {node.data.componentName || node.id}
                                </div>
                                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>
                                    v{node.data.version || 'Unknown'}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ backgroundColor: tileBg, color: tileColor, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                                    {node.data.status}
                                </span>
                                <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
                                    {dependencyCount} Dep
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ComponentExplorer;
