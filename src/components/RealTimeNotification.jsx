import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { connectWebSocket, disconnectWebSocket } from '../services/websocketService';

export default function RealTimeNotification({ onNotification }) {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Connexion WebSocket
        connectWebSocket((notification) => {
            handleNotification(notification);
            if (onNotification) onNotification(notification);
        });

        return () => {
            disconnectWebSocket();
        };
    }, [onNotification]);

    const handleNotification = (notification) => {
        // Ajouter la notification à l'état
        setNotifications(prev => [notification, ...prev].slice(0, 50));

        // Afficher un toast selon le type
        const toastConfig = {
            duration: 5000,
            position: 'top-right',
        };

        switch (notification.type) {
            case 'DEVIS_RECU':
                toast.success(`📄 ${notification.message}`, toastConfig);
                break;
            case 'DEVIS_VALIDE':
                toast.success(`✅ ${notification.message}`, toastConfig);
                break;
            case 'COMMANDE_EXPEDIEE':
                toast.success(`📦 ${notification.message}`, toastConfig);
                break;
            case 'COMMANDE_LIVREE':
                toast.success(`✅ ${notification.message}`, toastConfig);
                break;
            case 'VENTE':
                toast.success(`💰 ${notification.message}`, toastConfig);
                break;
            case 'STOCK_BAS':
                toast.error(`⚠️ ${notification.message}`, { ...toastConfig, duration: 10000 });
                break;
            default:
                toast.info(`${notification.message}`, toastConfig);
        }
    };

    const styles = {
        container: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            maxWidth: '350px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 999,
            display: 'none' // Cacher la liste (les toasts suffisent)
        }
    };

    // On n'affiche pas la liste, les toasts suffisent
    return null;
}