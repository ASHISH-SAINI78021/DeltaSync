import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import styles from './Dashboard.module.css';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const res = await api.get('/documents');
            setDocuments(res.data);
        } catch (err) {
            console.error('Failed to fetch docs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDoc = async () => {
        try {
            const res = await api.post('/documents', { title: 'Untitled Document' });
            navigate(`/doc/${res.data._id}`);
        } catch (err) {
            console.error('Failed to create doc', err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>My Documents</h1>
                    <p className={styles.greeting}>Welcome back, {user?.name}</p>
                </div>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                    <LogOut size={18} /> Logout
                </button>
            </header>

            <main className={styles.main}>
                <div className={styles.docGrid}>
                    {/* Create New Document Card */}
                    <button onClick={handleCreateDoc} className={`${styles.docCard} ${styles.createCard}`}>
                        <PlusCircle size={40} className={styles.createIcon} />
                        <span className={styles.createText}>Blank Document</span>
                    </button>

                    {/* User's existing documents */}
                    {documents.map((doc) => (
                        <div
                            key={doc._id}
                            className={styles.docCard}
                            onClick={() => navigate(`/doc/${doc._id}`)}
                        >
                            <div className={styles.docCardTop}>
                                <FileText size={32} color="#0EA5E9" />
                            </div>
                            <div className={styles.docCardBottom}>
                                <h3 className={styles.docTitle}>{doc.title}</h3>
                                <time className={styles.docDate}>
                                    Opend {new Date(doc.updatedAt).toLocaleDateString()}
                                </time>
                            </div>
                        </div>
                    ))}
                </div>

                {!loading && documents.length === 0 && (
                    <div className={styles.emptyState}>
                        You have not created any documents yet. Start a blank document!
                    </div>
                )}
            </main>
        </div>
    );
}
