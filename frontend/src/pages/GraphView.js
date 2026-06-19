import React from 'react';
import ReactFlow, { Background, Controls } from 'react-flow-renderer';

const GraphView = () => {
    // Hardcoded mock nodes for MVP as per brief (mock datasets)
    const elements = [
        { id: '1', type: 'input', data: { label: 'Endpoint (DEVICE-XYZ-123)' }, position: { x: 250, y: 50 }, style: { background: '#0076CE', color: '#fff' } },
        { id: '2', data: { label: 'SecurityAgent_7.17' }, position: { x: 100, y: 150 } },
        { id: '3', data: { label: 'Intel_NIC_22.0' }, position: { x: 400, y: 150 }, style: { border: '2px solid red', background: '#ffebee' } },
        { id: 'e1-2', source: '1', target: '2', label: 'HAS_COMPONENT' },
        { id: 'e1-3', source: '1', target: '3', label: 'HAS_COMPONENT' },
        { id: 'e2-3', source: '2', target: '3', label: 'INCOMPATIBLE_WITH', style: { stroke: 'red' }, animated: true },
    ];

    return (
        <div style={{ height: '80vh', width: '100%', border: '1px solid #ccc', backgroundColor: 'white', borderRadius: '8px' }}>
            <h2 style={{ padding: '0 20px' }}>Dependency Knowledge Graph</h2>
            <div style={{ height: 'calc(100% - 60px)' }}>
                <ReactFlow elements={elements} fitView>
                    <Background color="#aaa" gap={16} />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
};

export default GraphView;
