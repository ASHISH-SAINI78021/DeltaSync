import { useEffect, useRef, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
// Persistent UndoManager per documentId
const undoManagerMap = new Map();

import { WebsocketProvider } from 'y-websocket';
import { useAuth } from '../../context/AuthContext.jsx';
import { CURSOR_COLORS } from '../../lib/userColors.js';
import styles from './Editor.module.css';
import { IndexeddbPersistence } from 'y-indexeddb';
import { AIPanel } from './AIPanel.jsx';




export function Editor({ documentId = 'default-doc', wsUrl = 'ws://localhost:5000/ws', onStatusChange }) {
    const [ydoc, setYdoc] = useState(null);
    const [provider, setProvider] = useState(null);
    const [status, setStatus] = useState('connecting');
    const { user } = useAuth();
    const onStatusChangeRef = useRef(onStatusChange);
    const initRef = useRef(false);


    useEffect(() => {
        onStatusChangeRef.current = onStatusChange;
    });

    // Stable user profile
    const currentUser = useMemo(() => {
        const color = CURSOR_COLORS[Math.abs(
            (user?.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
        ) % CURSOR_COLORS.length] || '#0EA5E9';
        return { name: user?.name || 'Anonymous', color };
    }, [user]);

    // Initialize Yjs doc & provider strictly bound to documentId
    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;
        const token = localStorage.getItem('token');
        const newYdoc = new Y.Doc();

        const handleStatus = (event) => {
            console.log(`[Yjs] Status changed for room ${documentId}:`, event.status);
            setStatus(event.status);
            onStatusChangeRef.current?.(event.status);
        };

        const createProvider = () => {
            const prov = new WebsocketProvider(
                wsUrl,
                documentId,
                newYdoc,
                { params: token ? { token } : {} }
            );
            prov.on('status', handleStatus);
            prov.on('connection-close', () => {
                console.warn('[Yjs] Connection closed, attempting reconnection in 2s');
                setTimeout(() => {
                    // clean up old listeners before recreating
                    prov.off('status', handleStatus);
                    createProvider();
                }, 2000);
            });
            prov.on('connection-error', (err) => {
                console.error('[Yjs] Connection error:', err);
            });
            prov.on('synced', (isSynced) => {
                console.log('[Yjs] Synced status:', isSynced);
            });
            if (prov.wsconnected) {
                setStatus('connected');
                onStatusChangeRef.current?.('connected');
            }
            return prov;
        };

        const newProvider = createProvider();
        const indexeddbProvider = new IndexeddbPersistence(documentId, newYdoc);

        setYdoc(newYdoc);
        setProvider(newProvider);

        return () => {
            newProvider.off('status', handleStatus);
            newProvider.destroy();
            indexeddbProvider.destroy();
            newYdoc.destroy();
            setYdoc(null);
            setProvider(null);
            initRef.current = false;
        };
    }, [documentId, wsUrl]);

    // Only render the actual editor when the collaboration provider is fully ready
    if (!ydoc || !provider) {
        return (
            <div className={styles.editorWrapper}>
                <div className={styles.topBar}>
                    <span className={`${styles.statusBadge} ${styles.statusConnecting}`}>
                        <span className={styles.statusDot} /> Connecting sync server...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <InnerEditor
            documentId={documentId}
            ydoc={ydoc}
            provider={provider}
            currentUser={currentUser}
        />
    );
}

// Inner Editor isolates Tiptap's useEditor hook so it mounts WITH complete extensions synchronously
function InnerEditor({ documentId, ydoc, provider, currentUser }) {


    // Sync awareness on identity change
    useEffect(() => {
        if (provider?.awareness) {
            provider.awareness.setLocalStateField('user', currentUser);
        }
    }, [provider, currentUser]);



    // Initialize UndoManager scoped to this client's own transactions
    const undoManager = useMemo(() => {
        if (!undoManagerMap.has(documentId)) {
            const fragment = ydoc.getXmlFragment('prosemirror');
            const manager = new Y.UndoManager(fragment);
            undoManagerMap.set(documentId, manager);
        }
        return undoManagerMap.get(documentId);
    }, [documentId, ydoc]);

    // Editor instance initializes fully configured with collaboration
    const editor = useEditor({
        extensions: [
            StarterKit.configure({}), // built-in history (same as Ctrl+Z/Y)
            Collaboration.configure({ document: ydoc }),
            CollaborationCursor.configure({ provider, user: currentUser }),
        ],
    }, [ydoc, provider]);

    if (!editor) return null;

    return (
        <div className={styles.editorWrapper}>
            <div className={styles.topBar}>
                <div className={styles.toolbar}>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        className={styles.toolButton}
                        title="Undo (Ctrl+Z)"
                    >
                        Undo
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        className={styles.toolButton}
                        title="Redo (Ctrl+Y)"
                    >
                        Redo
                    </button>

                    <span className={styles.divider} />

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`${styles.toolButton} ${editor.isActive('bold') ? styles.toolButtonActive : ''}`}
                        title="Bold (Ctrl+B)"
                    >
                        <strong>B</strong>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`${styles.toolButton} ${editor.isActive('italic') ? styles.toolButtonActive : ''}`}
                        title="Italic (Ctrl+I)"
                    >
                        <em>I</em>
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        className={`${styles.toolButton} ${editor.isActive('code') ? styles.toolButtonActive : ''}`}
                        title="Code"
                    >
                        &lt;/&gt;
                    </button>

                    <span className={styles.divider} />

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        className={`${styles.toolButton} ${editor.isActive('heading', { level: 1 }) ? styles.toolButtonActive : ''}`}
                    >
                        H1
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`${styles.toolButton} ${editor.isActive('heading', { level: 2 }) ? styles.toolButtonActive : ''}`}
                    >
                        H2
                    </button>

                    <span className={styles.divider} />

                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`${styles.toolButton} ${editor.isActive('bulletList') ? styles.toolButtonActive : ''}`}
                    >
                        • List
                    </button>
                    <button
                        type="button"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`${styles.toolButton} ${editor.isActive('orderedList') ? styles.toolButtonActive : ''}`}
                    >
                        1. List
                    </button>
                </div>
            </div>

            <div className={styles.editorContent}>
                <EditorContent editor={editor} />
            </div>

            <AIPanel editor={editor} />
        </div>
    );
}

export default Editor;
