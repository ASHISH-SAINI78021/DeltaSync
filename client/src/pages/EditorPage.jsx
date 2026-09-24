import { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { Copy, Check, LayoutDashboard } from 'lucide-react';
import { Editor } from '../components/editor/Editor.jsx';
import { useAuth } from '../context/AuthContext';
import styles from './EditorPage.module.css';

export default function EditorPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [syncStatus, setSyncStatus] = useState('connecting');

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={styles.pageContainer}>
            <header className={styles.header}>
                <div className={styles.left}>
                    <button onClick={() => navigate('/dashboard')} className={styles.backBtn} title="Back to Dashboard">
                        <LayoutDashboard size={18} />
                    </button>
                    <div>
                        <h1 className={styles.title}>Collaborative Document</h1>
                        <span className={styles.roomId}>Room: {id}</span>
                    </div>
                </div>
                <div className={styles.right}>
                    <span className={`${styles.statusBadge} ${styles[`status_${syncStatus}`]}`}>
                        <span className={styles.statusDot} />
                        {syncStatus === 'connected' ? 'Synced live' : syncStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                    </span>
                    <button onClick={handleCopyLink} className={`${styles.copyBtn} ${copied ? styles.copyBtnSuccess : ''}`}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Link Copied!' : 'Copy Link'}
                    </button>
                </div>
            </header>

            <main className={styles.mainContent}>
                <Editor
                    documentId={id}
                    wsUrl={import.meta.env.VITE_WS_URL || 'ws://localhost:5001/ws'}
                    onStatusChange={setSyncStatus}
                />
            </main>
        </div>
    );
}
