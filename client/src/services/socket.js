import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Socket service URL - adjust port based on your socket service configuration
// For local development, use localhost. For Docker, browser connects to exposed port
// Default Spring Boot port is 8080
const getSocketUrl = () => {
  // Allow override via environment variable
  if (import.meta.env.VITE_SOCKET_URL) {
    console.log('Using VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // Browser connects to the host, so use the same hostname as the current page
  // Socket service is exposed on port 8080
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  
  // Use the same hostname but port 8080 for socket service
  // For localhost: use localhost:8080
  // For Docker: if client is on localhost:3000, socket is on localhost:8080
  const url = `${protocol}//${hostname}:8080/ws-uber`;
  console.log('Socket URL:', url);
  return url;
};

const SOCKET_URL = getSocketUrl();

class SocketService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
  }

  connect(onConnect, onError) {
    if (this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    console.log('Attempting to connect to socket:', SOCKET_URL);

    // Create SockJS connection
    const socket = new SockJS(SOCKET_URL);
    
    // Create STOMP client
    this.client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      onConnect: (frame) => {
        console.log('✅ Connected to WebSocket:', frame);
        this.isConnected = true;
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        if (onConnect) onConnect(frame);
      },
      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
        this.isConnected = false;
        if (onError) onError(frame);
      },
      onWebSocketError: (event) => {
        console.error('❌ WebSocket error:', event);
        this.isConnected = false;
        if (onError) onError(event);
      },
      onWebSocketClose: (event) => {
        console.log('⚠️ WebSocket connection closed:', event);
        this.isConnected = false;
        this.subscriptions.clear();
        // Attempt to reconnect if not manually disconnected
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            if (!this.isConnected) {
              this.connect(onConnect, onError);
            }
          }, 5000);
        } else {
          console.error('Max reconnection attempts reached');
        }
      },
      onDisconnect: () => {
        console.log('⚠️ Disconnected from WebSocket');
        this.isConnected = false;
        this.subscriptions.clear();
      },
    });

    try {
      this.client.activate();
      console.log('Socket client activation initiated');
    } catch (error) {
      console.error('❌ Error activating socket client:', error);
      this.isConnected = false;
      if (onError) onError(error);
    }
  }

  disconnect() {
    if (this.client && this.isConnected) {
      // Unsubscribe from all topics
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
      
      this.client.deactivate();
      this.isConnected = false;
      console.log('Disconnected from WebSocket');
    }
  }

  subscribe(topic, callback) {
    if (!this.isConnected || !this.client) {
      console.error('Socket not connected. Call connect() first.');
      return null;
    }

    const subscription = this.client.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing message:', error);
        callback(message.body);
      }
    });

    this.subscriptions.set(topic, subscription);
    console.log(`Subscribed to topic: ${topic}`);
    return subscription;
  }

  unsubscribe(topic) {
    const subscription = this.subscriptions.get(topic);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    }
  }

  sendMessage(roomId, content, sender) {
    if (!this.isConnected || !this.client) {
      console.error('❌ Socket not connected. Call connect() first.');
      return;
    }

    const message = {
      content,
      sender,
      roomId,
    };

    console.log('📤 Sending message:', {
      roomId: roomId,
      sender: sender,
      content: content,
      destination: '/app/messages/send',
      fullMessage: message
    });

    this.client.publish({
      destination: '/app/messages/send',
      body: JSON.stringify(message),
    });

    console.log('✅ Message published to STOMP');
  }

  // Subscribe to a specific room's messages
  subscribeToRoom(roomId, callback) {
    const topic = `/topic/messages/${roomId}`;
    return this.subscribe(topic, callback);
  }

  // Unsubscribe from a specific room
  unsubscribeFromRoom(roomId) {
    const topic = `/topic/messages/${roomId}`;
    this.unsubscribe(topic);
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;

