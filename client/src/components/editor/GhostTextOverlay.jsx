import React from 'react';
import styles from './AIPanel.module.css';

export default function GhostTextOverlay({ ghostText, onAccept, onReject }) {
    return (
        <div className={styles.ghostOverlay}>
            {ghostText}
            <div className={styles.ghostControls}>
                <button onClick={onAccept} className={styles.acceptBtn}>Accept</button>
                <button onClick={onReject} className={styles.rejectBtn}>Reject</button>
            </div>
        </div>
    );
}