import { useState } from 'react';
import { Bot, Send, Loader2 } from 'lucide-react';
import styles from './AIPanel.module.css';
import { useAuth } from '../../context/AuthContext';

export function AIPanel({ editor }) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [ghostText, setGhostText] = useState('');
    const [streaming, setStreaming] = useState(false);
    const { user } = useAuth();

    const handleAsk = async (e) => {
        e.preventDefault();
        if (!query.trim() || !editor) return;

        const userQuery = query.trim();
        setQuery('');
        setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
        setLoading(true);

        try {
            const documentText = editor.getText();
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/ai/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ documentText, query: userQuery })
            });

            if (!res.ok) throw new Error('API Error');
            const data = await res.json();

            setMessages(prev => [...prev, { role: 'ai', content: data.answer }]);
        } catch (error) {
            console.error('Error asking AI:', error);
            setMessages(prev => [...prev, { role: 'error', content: 'Failed to contact AI Assistant.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggest = async (e) => {
        e.preventDefault();
        if (!query.trim() || !editor) return;
        const userQuery = query.trim();
        setQuery('');
        setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
        setStreaming(true);
        setGhostText('');
        try {
            const documentText = editor.getText();
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/ai/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ documentText, query: userQuery })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                console.error('Stream API error, status:', res.status, errData);
                throw new Error(errData.details || errData.error || 'Stream API error');
            }
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            while (!done) {
                const { value, done: doneReading } = await reader.read();
                if (value) {
                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data:')) {
                            try {
                                const data = JSON.parse(line.slice(5).trim());
                                if (data.text) setGhostText(prev => prev + data.text);
                                if (data.done) done = true;
                            } catch (e) { /* ignore malformed */ }
                        }
                    }
                }
                if (doneReading) break;
            }
        } catch (error) {
            console.error('Streaming error:', error);
            setMessages(prev => [...prev, { role: 'error', content: 'Streaming failed.' }]);
        } finally {
            setStreaming(false);
        }
    };

    const acceptSuggestion = () => {
        if (ghostText && editor) {
            editor.commands.insertContent(ghostText);
            setGhostText('');
        }
    };

    const rejectSuggestion = () => {
        setGhostText('');
    };

    if (!isOpen) {
        return (
            <button className={styles.openBtn} onClick={() => setIsOpen(true)} title="Open AI Assistant">
                <Bot size={24} color="black" />
            </button>
        );
    }

    return (
        <div className={styles.panelContainer}>
            <div className={styles.panelHeader}>
                <div className={styles.headerLeft}>
                    <Bot size={18} />
                    <span>AI Assistant</span>
                </div>
                <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
            </div>

            <div className={styles.chatArea}>
                {messages.length === 0 && (
                    <div className={styles.emptyState}>Ask me anything about the document you are editing!</div>
                )}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`${styles.message} ${styles[msg.role]}`}>
                        {msg.content}
                    </div>
                ))}
                {(loading || streaming) && (
                    <div className={`${styles.message} ${styles.ai}`}>
                        <Loader2 size={16} className={styles.spinner} /> {loading ? 'Thinking...' : 'Streaming...'}
                    </div>
                )}
                {ghostText && (
                    <div className={styles.ghostOverlay}>
                        {ghostText}
                        <div className={styles.ghostControls}>
                            <button onClick={acceptSuggestion} className={styles.acceptBtn}>Accept</button>
                            <button onClick={rejectSuggestion} className={styles.rejectBtn}>Reject</button>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleAsk} className={styles.inputForm}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a question..."
                    className={styles.inputField}
                    disabled={loading || streaming}
                />
                <button type="submit" className={styles.sendBtn} disabled={!query.trim() || loading || streaming}>
                    <Send size={16} color="black" />
                </button>
                <button type="button" onClick={handleSuggest} className={styles.suggestBtn} disabled={!query.trim() || loading || streaming}>
                    Suggest
                </button>
            </form>
        </div>
    );
}
