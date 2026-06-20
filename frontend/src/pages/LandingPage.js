import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Monitor } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px', animation: 'fadeIn 0.5s ease' }}>
                <h1 style={{ fontSize: '48px', fontWeight: '800', margin: '0 0 16px 0', letterSpacing: '-1px' }}>
                    <span style={{ color: '#38bdf8' }}>AI</span>Compliance Engine
                </h1>
                <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    Select your portal to proceed to the intelligent configuration and compatibility management system.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '32px', animation: 'fadeIn 0.7s ease' }}>
                {/* Admin Portal Card */}
                <div 
                    className="glass-card" 
                    style={{ width: '300px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderTop: '4px solid #3b82f6' }}
                    onClick={() => navigate('/admin/ingest')}
                >
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                        <Shield size={32} color="#3b82f6" />
                    </div>
                    <h2 style={{ fontSize: '20px', margin: '0 0 12px 0' }}>IT Administrator Console</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px 0' }}>
                        Manage global knowledge graph, ingest vendor release notes, and monitor enterprise compliance.
                    </p>
                    <button className="btn-primary" style={{ width: '100%' }}>Login as Admin</button>
                </div>

                {/* Client Agent Card */}
                <div 
                    className="glass-card" 
                    style={{ width: '300px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderTop: '4px solid #10b981' }}
                    onClick={() => navigate('/client/scan')}
                >
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                        <Monitor size={32} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: '20px', margin: '0 0 12px 0' }}>Endpoint Client Agent</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 24px 0' }}>
                        Scan your local hardware, check device compliance, and execute automated remediation scripts.
                    </p>
                    <button className="btn-primary" style={{ width: '100%', backgroundColor: '#10b981' }}>Launch Agent</button>
                </div>
            </div>
            
            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}
            </style>
        </div>
    );
};

export default LandingPage;
