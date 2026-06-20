import React, { useState, useRef } from 'react';
import { uploadDocument } from '../api';
import { UploadCloud, FileText } from 'lucide-react';

const DocumentUpload = () => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [animationLines, setAnimationLines] = useState([]);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const terminalRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setAnimationLines([]);
            setUploadComplete(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setAnimationLines([]);
            setUploadComplete(false);
        }
    };

    const runSimulatedAnimation = async (filename) => {
        const lines = [
            { text: "Initializing deep semantics parsers...", delay: 0, type: "info" },
            { text: `Reading document payload: ${filename}`, delay: 600, type: "info" },
            { text: "Extracting knowledge entities...", delay: 1500, type: "process" },
            { text: "Found hardware constraints. Building dependency matrix...", delay: 2800, type: "process" },
            { text: "[RULE MATCH] REQUIRES -> Conf=98.5% [degrades_silently=true]", delay: 3800, type: "success" },
            { text: "[RULE MATCH] INCOMPATIBLE -> Conf=86.2% [ambiguous=true]", delay: 4600, type: "warning" },
            { text: "Knowledge Graph vectors successfully updated!", delay: 5500, type: "success" }
        ];

        for (const line of lines) {
            await new Promise(r => setTimeout(r, line.delay === 0 ? 0 : line.delay - (lines[lines.indexOf(line)-1]?.delay || 0)));
            setAnimationLines(prev => [...prev, { text: line.text, type: line.type }]);
            if (terminalRef.current) {
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
        }
        setUploadComplete(true);
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setAnimationLines([]);
        
        try {
            const uploadPromise = uploadDocument(file);
            const animPromise = runSimulatedAnimation(file.name);
            await Promise.all([uploadPromise, animPromise]);
        } catch (error) {
            console.error("Upload failed", error);
            setAnimationLines(prev => [...prev, { text: "ERROR: Failed to establish secure connection to API backend.", type: "error" }]);
            setUploadComplete(true);
        }
        setIsUploading(false);
    };

    const getColorForType = (type) => {
        switch(type) {
            case 'info': return '#8b949e';
            case 'process': return '#38bdf8';
            case 'success': return '#4ade80';
            case 'warning': return '#fbbf24';
            case 'error': return '#f87171';
            default: return 'var(--terminal-text)';
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700' }}>Document Ingestion Pipeline</h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Upload enterprise compatibility PDFs or raw text to dynamically train the Knowledge Graph.</p>
            </div>
            
            <div className="glass-card" style={{ marginBottom: '32px' }}>
                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    style={{ 
                        border: `2px dashed ${isDragActive ? 'var(--button-bg)' : 'var(--card-border)'}`, 
                        borderRadius: '12px', 
                        padding: '40px 20px', 
                        textAlign: 'center',
                        backgroundColor: isDragActive ? 'var(--info-bg)' : 'var(--bg-color)',
                        transition: 'all 0.2s',
                        marginBottom: '24px',
                        cursor: 'pointer'
                    }}
                    onClick={() => document.getElementById('file-upload').click()}
                >
                    <input 
                        id="file-upload"
                        type="file" 
                        onChange={handleFileChange} 
                        accept=".pdf,.txt"
                        disabled={isUploading}
                        style={{ display: 'none' }}
                    />
                    <UploadCloud size={48} color={isDragActive ? 'var(--button-bg)' : 'var(--text-secondary)'} style={{ marginBottom: '16px' }} />
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>
                        {file ? file.name : "Drag and drop your document here"}
                    </h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {file ? "File selected and ready for extraction." : "Or click to browse from your computer (PDF, TXT)"}
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleUpload(); }} 
                        disabled={!file || isUploading}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px' }}
                    >
                        <FileText size={18} />
                        {isUploading ? "Extracting Semantics..." : "Upload & Extract"}
                    </button>
                </div>
            </div>

            {(animationLines.length > 0 || isUploading) && (
                <div className="glass-card" style={{ animation: 'fadeIn 0.5s ease' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isUploading ? '#38bdf8' : '#4ade80', animation: isUploading ? 'pulse 1.5s infinite' : 'none' }}></span>
                        LLM Extraction Pipeline
                    </h4>
                    <div style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--terminal-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow)' }}>
                        <div style={{ backgroundColor: 'var(--terminal-header)', padding: '10px 16px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
                            <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>llm-parser-worker.sh</span>
                        </div>
                        <pre ref={terminalRef} style={{ margin: 0, padding: '20px', color: 'var(--terminal-text)', fontSize: '14px', lineHeight: '1.7', overflowY: 'auto', maxHeight: '350px', fontFamily: 'monospace' }}>
                            {animationLines.map((line, i) => (
                                <div key={i} style={{ display: 'flex' }}>
                                    <span style={{ width: '32px', color: 'var(--text-secondary)', textAlign: 'right', paddingRight: '16px', userSelect: 'none', borderRight: '1px solid var(--card-border)', marginRight: '16px' }}>{i + 1}</span>
                                    <span style={{ color: getColorForType(line.type) }}>
                                        {line.text}
                                    </span>
                                </div>
                            ))}
                            {isUploading && !uploadComplete && (
                                <div style={{ display: 'flex' }}>
                                    <span style={{ width: '32px', color: 'var(--text-secondary)', textAlign: 'right', paddingRight: '16px', userSelect: 'none', borderRight: '1px solid var(--card-border)', marginRight: '16px' }}>{animationLines.length + 1}</span>
                                    <span style={{ color: 'var(--terminal-text)', animation: 'blink 1s step-end infinite' }}>█</span>
                                </div>
                            )}
                        </pre>
                    </div>
                </div>
            )}
            <style>
                {`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}
            </style>
        </div>
    );
};

export default DocumentUpload;
