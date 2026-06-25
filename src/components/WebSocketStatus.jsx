import React, { useState, useEffect } from 'react';
import { isConnected } from '../services/websocketService';

export default function WebSocketStatus() {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setConnected(isConnected());
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: connected ? '#10b981' : '#ef4444',
            marginRight: '16px'
        }}>
            <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: connected ? '#10b981' : '#ef4444',
                display: 'inline-block'
            }}></span>
            {connected ? 'Connecté' : 'Déconnecté'}
        </span>
    );
}