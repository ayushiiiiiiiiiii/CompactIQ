import React, { useState, useEffect } from 'react';
import { getDocumentsList, removeDocument, flushDatabase } from '../api/endpoints';
import { Database, Trash2, AlertTriangle, X } from 'lucide-react';

const KnowledgeBaseAdmin = () => {
    const [documents, setDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({
        title: "",
        warningText: "",
        actionType: "", // "REMOVE_DOC" or "FLUSH_DB"
        targetId: null,
        targetName: ""
    });
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const data = await getDocumentsList();
            setDocuments(data.documents || []);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch documents:", err);
            setError("Failed to load compatibility documents.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveClick = (doc) => {
        setModalConfig({
            title: "Remove Document",
            warningText: `Removing "${doc.filename}" will delete its compatibility rules from the database and delete the physical file. This may affect future compatibility calculations.`,
            actionType: "REMOVE_DOC",
            targetId: doc.id,
            targetName: doc.filename
        });
        setPassword("");
        setIsModalOpen(true);
    };

    const handleFlushClick = () => {
        setModalConfig({
            title: "Flush Compatibility Database",
            warningText: "This operation will remove all compatibility rules, document records, and device inventory history from the database. Physical files in the compatibility_docs folder will NOT be deleted. Future ingestion operations may rebuild the compatibility database from available seed documents.",
            actionType: "FLUSH_DB",
            targetId: null,
            targetName: ""
        });
        setPassword("");
        setIsModalOpen(true);
    };

    const handleConfirm = async () => {
        if (!password) {
            setError("Administrator password is required.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage("");

        try {
            if (modalConfig.actionType === "REMOVE_DOC") {
                await removeDocument(modalConfig.targetId, password);
                setSuccessMessage("Document successfully removed.");
            } else if (modalConfig.actionType === "FLUSH_DB") {
                await flushDatabase(password);
                setSuccessMessage("Database successfully flushed.");
            }
            setIsModalOpen(false);
            fetchDocuments();
            
            setTimeout(() => setSuccessMessage(""), 5000);
        } catch (err) {
            console.error("Action failed:", err);
            if (err.response && err.response.data && err.response.data.detail) {
                setError(`Error: ${err.response.data.detail}`);
            } else {
                setError("Operation failed. Please verify your password and try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString();
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700' }}>Knowledge Base Administration</h1>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Manage compatibility documents and perform database maintenance operations.</p>
            </div>

            {successMessage && (
                <div style={{ padding: '16px', backgroundColor: 'var(--success-bg)', borderLeft: '4px solid var(--success-border)', borderRadius: '4px', marginBottom: '24px', color: 'var(--success-text)' }}>
                    {successMessage}
                </div>
            )}

            {error && !isModalOpen && (
                <div style={{ padding: '16px', backgroundColor: 'var(--error-bg)', borderLeft: '4px solid var(--error-border)', borderRadius: '4px', marginBottom: '24px', color: 'var(--error-text)' }}>
                    {error}
                </div>
            )}

            {/* Section 1: Compatibility Documents */}
            <div className="glass-card" style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={20} color="#38bdf8" />
                    Compatibility Documents
                </h3>
                
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}>
                                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Document Name</th>
                                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Status</th>
                                <th style={{ padding: '12px 16px', fontWeight: '500' }}>Uploaded/Discovered Date</th>
                                <th style={{ padding: '12px 16px', fontWeight: '500', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading documents...</td>
                                </tr>
                            ) : documents.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No documents found.</td>
                                </tr>
                            ) : (
                                documents.map(doc => (
                                    <tr key={doc.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: '500' }}>{doc.filename}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ 
                                                padding: '4px 8px', 
                                                borderRadius: '12px', 
                                                fontSize: '12px', 
                                                fontWeight: '600',
                                                backgroundColor: doc.status === 'completed' ? 'var(--success-bg)' : 'var(--error-bg)',
                                                color: doc.status === 'completed' ? 'var(--success-text)' : 'var(--error-text)'
                                            }}>
                                                {doc.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{formatDate(doc.ingested_at)}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => handleRemoveClick(doc)}
                                                style={{ 
                                                    background: 'none', 
                                                    border: 'none', 
                                                    color: 'var(--error-text)', 
                                                    cursor: 'pointer',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '6px 12px',
                                                    borderRadius: '4px',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--error-bg)'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <Trash2 size={16} /> Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Section 2: Maintenance Operations */}
            <div className="glass-card" style={{ borderLeft: '4px solid #fbbf24' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={20} color="#fbbf24" />
                    Maintenance Operations
                </h3>
                <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)' }}>
                    Administrative actions that affect the entire application state. Use with caution.
                </p>
                <button 
                    onClick={handleFlushClick}
                    style={{ 
                        padding: '10px 20px', 
                        backgroundColor: 'transparent', 
                        border: '1px solid #fbbf24', 
                        color: '#fbbf24', 
                        borderRadius: '6px', 
                        cursor: 'pointer', 
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fbbf24'; e.currentTarget.style.color = 'var(--bg-color)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#fbbf24'; }}
                >
                    Flush Compatibility Database
                </button>
            </div>

            {/* Password Confirmation Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--error-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={20} />
                                {modalConfig.title}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                            {modalConfig.warningText}
                        </p>

                        {error && isModalOpen && (
                            <div style={{ padding: '12px', backgroundColor: 'var(--error-bg)', borderRadius: '4px', marginBottom: '16px', color: 'var(--error-text)', fontSize: '14px' }}>
                                {error}
                            </div>
                        )}

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-primary)' }}>
                                Enter administrator password to continue:
                            </label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--card-border)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}
                                autoFocus
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                style={{ padding: '8px 16px', backgroundColor: 'transparent', border: '1px solid var(--card-border)', color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirm}
                                disabled={isSubmitting || !password}
                                style={{ padding: '8px 16px', backgroundColor: 'var(--error-border)', border: 'none', color: 'white', borderRadius: '6px', cursor: isSubmitting || !password ? 'not-allowed' : 'pointer', opacity: isSubmitting || !password ? 0.7 : 1 }}
                            >
                                {isSubmitting ? "Processing..." : (modalConfig.actionType === "REMOVE_DOC" ? "Confirm Removal" : "Flush Database")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KnowledgeBaseAdmin;
