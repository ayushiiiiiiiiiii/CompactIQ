import React, { useState, useRef } from 'react';
import { uploadDocument } from '../api';

const DocumentUpload = () => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [animationLines, setAnimationLines] = useState([]);
    const [uploadComplete, setUploadComplete] = useState(false);
    const terminalRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setAnimationLines([]);
            setUploadComplete(false);
        }
    };

    const runSimulatedAnimation = async (filename) => {
        const lines = [
            { text: "Initializing LLM parsers...", delay: 0, type: "info" },
            { text: `Reading document: ${filename}`, delay: 500, type: "info" },
            { text: "Extracting textual semantics...", delay: 1200, type: "process" },
            { text: "Found 14 hardware rules. Parsing dependencies...", delay: 2500, type: "process" },
            { text: "Rule 1: REQUIRES -> Conf=98% [degrades_silently=true]", delay: 3500, type: "success" },
            { text: "Rule 2: INCOMPATIBLE -> Conf=85% [ambiguous=true]", delay: 4200, type: "warning" },
            { text: "Knowledge Graph successfully updated!", delay: 5000, type: "success" }
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
            // Kick off the animation and the real API call concurrently
            const uploadPromise = uploadDocument(file);
            const animPromise = runSimulatedAnimation(file.name);
            
            await Promise.all([uploadPromise, animPromise]);
            
        } catch (error) {
            console.error("Upload failed", error);
            setAnimationLines(prev => [...prev, { text: "ERROR: Failed to reach backend API.", type: "error" }]);
            setUploadComplete(true);
        }
        setIsUploading(false);
    };

    const getColorForType = (type) => {
        switch(type) {
            case 'info': return '#8b949e';
            case 'process': return '#79c0ff';
            case 'success': return '#7ee787';
            case 'warning': return '#d2a8ff';
            case 'error': return '#ff7b72';
            default: return '#c9d1d9';
        }
    };

    return (
        <div>
            <h1>Document Ingestion</h1>
            <p>Upload enterprise compatibility documents (PDF/TXT) to continuously update the Knowledge Graph.</p>
            
            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <input 
                        type="file" 
                        onChange={handleFileChange} 
                        accept=".pdf,.txt"
                        disabled={isUploading}
                    />
                    <button 
                        onClick={handleUpload} 
                        disabled={!file || isUploading}
                        style={{ padding: '10px 20px', backgroundColor: '#0076CE', color: 'white', border: 'none', borderRadius: '4px', cursor: (!file || isUploading) ? 'not-allowed' : 'pointer' }}
                    >
                        {isUploading ? "Extracting..." : "Upload & Extract"}
                    </button>
                </div>

                {(animationLines.length > 0 || isUploading) && (
                    <div style={{ marginTop: '30px' }}>
                        <h4 style={{ marginBottom: '10px' }}>LLM Extraction Pipeline (Simulated)</h4>
                        <div style={{ borderRadius: '8px', overflow: 'hidden', backgroundColor: '#0d1117', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                            <div style={{ backgroundColor: '#161b22', padding: '8px 12px', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }}></div>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }}></div>
                                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#8b949e', fontFamily: 'monospace' }}>llm-parser.sh</span>
                            </div>
                            <pre ref={terminalRef} style={{ margin: 0, padding: '16px', color: '#c9d1d9', fontSize: '13px', lineHeight: '1.6', overflowY: 'auto', maxHeight: '300px', fontFamily: 'monospace' }}>
                                {animationLines.map((line, i) => (
                                    <div key={i} style={{ display: 'flex' }}>
                                        <span style={{ width: '24px', color: '#484f58', textAlign: 'right', paddingRight: '12px', userSelect: 'none', borderRight: '1px solid #30363d', marginRight: '12px' }}>{i + 1}</span>
                                        <span style={{ color: getColorForType(line.type) }}>
                                            {line.text}
                                        </span>
                                    </div>
                                ))}
                                {isUploading && !uploadComplete && (
                                    <div style={{ display: 'flex' }}>
                                        <span style={{ width: '24px', color: '#484f58', textAlign: 'right', paddingRight: '12px', userSelect: 'none', borderRight: '1px solid #30363d', marginRight: '12px' }}>{animationLines.length + 1}</span>
                                        <span style={{ color: '#c9d1d9', animation: 'blink 1s step-end infinite' }}>_</span>
                                    </div>
                                )}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
            <style>
                {`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                `}
            </style>
        </div>
    );
};

export default DocumentUpload;
