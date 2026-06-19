import React, { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls } from 'react-flow-renderer';
import { getGraphElements } from '../api';

const GraphView = () => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [loading, setLoading] = useState(true);

    // Hardcoded mock nodes as fallback
    const mockElements = [
        { id: 'endpoint-device', type: 'input', data: { label: 'Endpoint (DEVICE-XYZ-123)' }, position: { x: 250, y: 50 }, style: { background: '#0076CE', color: '#fff' } },
        { id: 'SecurityAgent_7.17', data: { label: 'Security Agent v7.17' }, position: { x: 100, y: 180 } },
        { id: 'Intel_NIC_22.0', data: { label: 'Intel NIC v22.0' }, position: { x: 380, y: 180 }, style: { border: '2px solid red', background: '#ffebee' } },
        { id: 'edge-endpoint-SecurityAgent_7.17', source: 'endpoint-device', target: 'SecurityAgent_7.17', label: 'HAS_COMPONENT' },
        { id: 'edge-endpoint-Intel_NIC_22.0', source: 'endpoint-device', target: 'Intel_NIC_22.0', label: 'HAS_COMPONENT' },
        { id: 'edge-rel-incompatibility', source: 'SecurityAgent_7.17', target: 'Intel_NIC_22.0', label: 'INCOMPATIBLE', style: { stroke: 'red' }, animated: true },
    ];

    useEffect(() => {
        const fetchGraph = async () => {
            try {
                const deviceId = localStorage.getItem('scannedDeviceId');
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
        return <div style={{ padding: '20px' }}>Loading Knowledge Graph...</div>;
    }

    return (
        <div style={{ width: '100%', border: '1px solid #ccc', backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxSizing: 'border-box' }}>
            <h2 style={{ margin: '0 0 20px 0' }}>Dependency Knowledge Graph</h2>
            <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                <strong>Debug Info:</strong> Loaded {nodes.length + edges.length} graph elements from API/Mock.
            </div>
            <div style={{ height: '600px', width: '100%', minHeight: '600px', position: 'relative', display: 'block' }}>
                {nodes.length > 0 ? (
                    <ReactFlow nodes={nodes} edges={edges} style={{ width: '900px', height: '600px' }}>
                        <Background color="#aaa" gap={16} />
                        <Controls />
                    </ReactFlow>
                ) : (
                    <div style={{ padding: '20px' }}>No graph nodes found to display.</div>
                )}
            </div>
        </div>
    );
};

export default GraphView;
