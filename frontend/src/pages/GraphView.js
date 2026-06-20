import React, { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls } from 'react-flow-renderer';
import { getGraphElements } from '../api';
import { Network } from 'lucide-react';

const GraphView = ({ isGlobal }) => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [loading, setLoading] = useState(true);

    const mockElements = [
        { id: 'endpoint-device', type: 'input', data: { label: 'Endpoint (DEVICE-XYZ-123)' }, position: { x: 250, y: 50 }, style: { background: 'var(--button-bg)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '600' } },
        { id: 'SecurityAgent_7.17', data: { label: 'Security Agent v7.17' }, position: { x: 100, y: 180 }, style: { background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '10px' } },
        { id: 'Intel_NIC_22.0', data: { label: 'Intel NIC v22.0' }, position: { x: 380, y: 180 }, style: { border: '2px solid var(--error-border)', background: 'var(--error-bg)', color: 'var(--error-text)', borderRadius: '8px', padding: '10px', fontWeight: '500' } },
        { id: 'edge-endpoint-SecurityAgent_7.17', source: 'endpoint-device', target: 'SecurityAgent_7.17', label: 'HAS_COMPONENT' },
        { id: 'edge-endpoint-Intel_NIC_22.0', source: 'endpoint-device', target: 'Intel_NIC_22.0', label: 'HAS_COMPONENT' },
        { id: 'edge-rel-incompatibility', source: 'SecurityAgent_7.17', target: 'Intel_NIC_22.0', label: 'INCOMPATIBLE', style: { stroke: 'var(--error-border)', strokeWidth: 2 }, animated: true },
    ];

    useEffect(() => {
        const fetchGraph = async () => {
            try {
                const deviceId = isGlobal ? null : localStorage.getItem('scannedDeviceId');
                const data = await getGraphElements(deviceId);
                let graphElements = [];
                if (data && data.elements && data.elements.length > 0) {
                    graphElements = data.elements;
                } else {
                    graphElements = mockElements;
                }
                
                const initialNodes = graphElements.filter(el => !el.source && !el.target);
                const initialEdges = graphElements.filter(el => el.source && el.target);
                
                setNodes(initialNodes);
                setEdges(initialEdges);
            } catch (error) {
                console.error("Failed to fetch graph from API, using mock elements", error);
                const initialNodes = mockElements.filter(el => !el.source && !el.target);
                const initialEdges = mockElements.filter(el => el.source && el.target);
                setNodes(initialNodes);
                setEdges(initialEdges);
            }
            setLoading(false);
        };
        fetchGraph();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--card-border)', borderTopColor: 'var(--button-bg)', animation: 'spin 1s linear infinite' }}></div>
                <div style={{ color: 'var(--text-secondary)' }}>Loading Knowledge Graph...</div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Network size={28} color={isGlobal ? "#3b82f6" : "#10b981"} />
                    {isGlobal ? "Global Knowledge Graph" : "Device Dependency Graph"}
                </h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    {isGlobal ? "Visual representation of all enterprise constraints, requirements, and hardware rules." : "Visual representation of all endpoint constraints, requirements, and hardware collisions."}
                </p>
            </div>
            
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', backgroundColor: 'var(--bg-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '16px' }}>
                        <span><strong>Nodes:</strong> {nodes.length}</span>
                        <span><strong>Edges:</strong> {edges.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}></div> Conflict</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--bg-color)', border: '1px solid var(--card-border)' }}></div> Valid Component</span>
                    </div>
                </div>
                
                <div style={{ flex: 1, position: 'relative', background: 'var(--bg-color)' }}>
                    {nodes.length > 0 ? (
                        <ReactFlow nodes={nodes} edges={edges}>
                            <Background color="var(--text-secondary)" gap={16} size={1} />
                            <Controls style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow)' }} />
                        </ReactFlow>
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>No graph nodes found to display.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GraphView;
