import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;
let subscribers = [];

export const connectWebSocket = (onNotification) => {
    if (stompClient && stompClient.connected) {
        console.log('WebSocket déjà connecté');
        return;
    }

    const client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        debug: (str) => console.log('WebSocket:', str),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
        console.log('✅ WebSocket connecté');
        
        // S'abonner au topic des notifications
        client.subscribe('/topic/notifications', (message) => {
            const notification = JSON.parse(message.body);
            if (onNotification) {
                onNotification(notification);
            }
        });
    };

    client.onStompError = (frame) => {
        console.error('❌ Erreur WebSocket:', frame);
    };

    client.activate();
    stompClient = client;
};

export const disconnectWebSocket = () => {
    if (stompClient) {
        stompClient.deactivate();
        stompClient = null;
        console.log('WebSocket déconnecté');
    }
};

export const isConnected = () => {
    return stompClient && stompClient.connected;
};