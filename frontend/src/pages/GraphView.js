import React, { useEffect, useState } from 'react';
import ReactFlow, { Background, Controls } from 'react-flow-renderer';
import { getGraphElements } from '../api';

const GraphView = () => {
    const [elements, setElements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGraph = async () => {
            try {
                const data = await getGraphElements();
                if (data && data.elements && data.elements.length > 0) {
                    setElements(data.elements);
                } else {
                    setElements(mockElements);
                }
            } catch (error) {
                console.error("Failed to fetch graph from API, using mock elements", error);
                setElements(mockElements);
            }
            setLoading(false);
        };
        fetchGraph();
    }, []);

    // Hardcoded mock nodes as fallback
    const mockElements = [
        { id: 'endpoint-device', type: 'input', data: { label: 'Endpoint (DEVICE-XYZ-123)' }, position: { x: 250, y: 50 }, style: { background: '#0076CE', color: '#fff' } },
        { id: 'SecurityAgent_7.17', data: { label: 'Security Agent v7.17' }, position: { x: 100, y: 180 } },
        { id: 'Intel_NIC_22.0', data: { label: 'Intel NIC v22.0' }, position: { x: 380, y: 180 }, style: { border: '2px solid red', background: '#ffebee' } },
        { id: 'edge-endpoint-SecurityAgent_7.17', source: 'endpoint-device', target: 'SecurityAgent_7.17', label: 'HAS_COMPONENT' },
        { id: 'edge-endpoint-Intel_NIC_22.0', source: 'endpoint-device', target: 'Intel_NIC_22.0', label: 'HAS_COMPONENT' },
        { id: 'edge-rel-incompatibility', source: 'SecurityAgent_7.17', target: 'Intel_NIC_22.0', label: 'INCOMPATIBLE', style: { stroke: 'red' }, animated: true },
    ];

    if (loading) {
        return <div style={{ padding: '20px' }}>Loading Knowledge Graph...</div>;
    }

    return (
        <div style={{ width: '100%', border: '1px solid #ccc', backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxSizing: 'border-box' }}>
            <h2 style={{ margin: '0 0 20px 0' }}>Dependency Knowledge Graph</h2>
            <div style={{ height: '600px', width: '100%', minHeight: '600px', position: 'relative', display: 'block' }}>
                {elements.length > 0 ? (
                    <ReactFlow elements={elements} style={{ width: '100%', height: '600px', minHeight: '600px' }}>
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
