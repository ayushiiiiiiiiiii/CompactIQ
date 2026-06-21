import React, { useContext, useState, useMemo } from 'react';
import ReactFlow, { Background, Controls, MarkerType } from 'react-flow-renderer';
import { AppContext } from '../context/AppContext';
import ComponentModal from '../components/ComponentModal';
import { Link } from 'react-router-dom';

const GraphView = () => {
    const { graphData, setSelectedComponent, setIsModalOpen } = useContext(AppContext);
    const [filter, setFilter] = useState('ALL'); // ALL, VIOLATIONS, HEALTHY
    const [selectedNodeId, setSelectedNodeId] = useState(null);

    const activeGraphData = graphData;

    // Use useMemo to prevent unnecessary recalculations
    const { nodes, edges } = useMemo(() => {
        if (!activeGraphData || !activeGraphData.elements) return { nodes: [], edges: [] };
        
        let initialNodes = activeGraphData.elements.filter(el => !el.source && !el.target);
        let initialEdges = activeGraphData.elements.filter(el => el.source && el.target);

        // Apply global filters
        if (filter === 'VIOLATIONS') {
            initialNodes = initialNodes.filter(n => n.data.status === 'Non-Compliant' || n.data.status === 'Warning' || n.data.status === 'Missing');
            const validNodeIds = new Set(initialNodes.map(n => n.id));
            initialEdges = initialEdges.filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target));
        } else if (filter === 'HEALTHY') {
            initialNodes = initialNodes.filter(n => n.data.status === 'Compliant' || n.data.status === 'Endpoint');
            const validNodeIds = new Set(initialNodes.map(n => n.id));
            initialEdges = initialEdges.filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target));
        }

        // Apply highlighting logic if a node is selected
        if (selectedNodeId) {
            const connectedNodes = new Set();
            connectedNodes.add(selectedNodeId);
            
            // Basic BFS for upstream/downstream dependencies
            let queue = [selectedNodeId];
            while (queue.length > 0) {
                const current = queue.shift();
                initialEdges.forEach(e => {
                    if (e.source === current && !connectedNodes.has(e.target)) {
                        connectedNodes.add(e.target);
                        queue.push(e.target);
                    }
                    if (e.target === current && !connectedNodes.has(e.source)) {
                        connectedNodes.add(e.source);
                        queue.push(e.source);
                    }
                });
            }

            initialNodes = initialNodes.map(n => ({
                ...n,
                style: {
                    ...n.style,
                    opacity: connectedNodes.has(n.id) ? 1 : 0.2
                }
            }));
            
            initialEdges = initialEdges.map(e => ({
                ...e,
                style: {
                    ...e.style,
                    opacity: (connectedNodes.has(e.source) && connectedNodes.has(e.target)) ? 1 : 0.1
                }
            }));
        }

        return { nodes: initialNodes, edges: initialEdges };
    }, [activeGraphData, filter, selectedNodeId]);

    if (!activeGraphData || !activeGraphData.elements) {
        return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>No graph data available. Please ensure the scan has completed.</div>;
    }

    const onNodeClick = (e, node) => {
        // Toggle selection or select new
        if (selectedNodeId === node.id) {
            setSelectedNodeId(null);
        } else {
            setSelectedNodeId(node.id);
            setSelectedComponent(node);
            setIsModalOpen(true);
        }
    };

    const onPaneClick = () => {
        setSelectedNodeId(null);
    };

    const backLink = '/client/scan';
    const backLabel = '← Back to Dashboard';

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.5s ease-in' }}>
            <ComponentModal />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--card-border)', paddingBottom: '15px', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Link to={backLink} style={{ color: '#0076CE', textDecoration: 'none', fontSize: '16px' }}>{backLabel}</Link>
                        Knowledge Graph Explorer
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Visualizing dependency chains and compatibility logic.
                    </p>
                </div>
                
                {/* Filters */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => setFilter('ALL')}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--card-border)', background: filter === 'ALL' ? 'var(--card-border)' : 'var(--card-bg)', color: 'var(--text-primary)', cursor: 'pointer' }}
                    >All Components</button>
                    <button 
                        onClick={() => setFilter('VIOLATIONS')}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--error-border)', background: filter === 'VIOLATIONS' ? 'var(--error-bg)' : 'var(--card-bg)', cursor: 'pointer', color: 'var(--error-text)' }}
                    >Violations Only</button>
                    <button 
                        onClick={() => setFilter('HEALTHY')}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--success-border)', background: filter === 'HEALTHY' ? 'var(--success-bg)' : 'var(--card-bg)', cursor: 'pointer', color: 'var(--success-text)' }}
                    >Healthy Only</button>
                    <button 
                        onClick={() => { setFilter('ALL'); setSelectedNodeId(null); }}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)', cursor: 'pointer', marginLeft: '10px' }}
                    >Reset Graph</button>
                </div>
            </div>

            <div style={{ flex: 1, backgroundColor: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)', overflow: 'hidden', position: 'relative' }}>
                <ReactFlow 
                    nodes={nodes} 
                    edges={edges} 
                    fitView 
                    style={{ width: '100%', height: '100%' }}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                >
                    <Background color="#cbd5e1" gap={16} />
                    <Controls />
                    
                    {/* Legend Panel */}
                    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, backgroundColor: 'var(--glass-bg)', padding: '15px', borderRadius: '8px', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)', fontSize: '12px' }}>
                        <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>Graph Legend</strong>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 'bold' }}>Component Health</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#f0fdf4', border: '2px solid #10b981', borderRadius: '2px' }}></div>
                                <span style={{ color: 'var(--text-primary)' }}>Healthy / Compliant</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '2px' }}></div>
                                <span style={{ color: 'var(--text-primary)' }}>Warning / Needs Attention</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#fef2f2', border: '2px solid #ef4444', borderRadius: '2px' }}></div>
                                <span style={{ color: 'var(--text-primary)' }}>Violation / Conflict Present</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#fff', border: '2px dashed #f59e0b', borderRadius: '2px' }}></div>
                                <span style={{ color: 'var(--text-primary)' }}>Missing Dependency</span>
                            </div>
                        </div>

                        <div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 'bold' }}>Relationships</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '20px', height: '2px', backgroundColor: '#3b82f6' }}></div>
                                <span style={{ color: 'var(--text-primary)' }}>REQUIRES / DEPENDS_ON</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '20px', height: '2px', backgroundColor: '#ef4444' }}></div>
                                <span style={{ color: 'var(--text-primary)' }}>INCOMPATIBLE_WITH</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '20px', height: '2px', backgroundColor: '#cbd5e1', borderTop: '2px dashed #cbd5e1' }}></div>
                                <span style={{ color: 'var(--text-primary)' }}>HAS_COMPONENT</span>
                            </div>
                        </div>
                        <div style={{ marginTop: '10px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                            Click a node to highlight chain.
                        </div>
                    </div>
                </ReactFlow>
            </div>
        </div>
    );
};

export default GraphView;
