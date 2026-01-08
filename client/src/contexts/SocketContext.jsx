import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Connect when component mounts
    socketService.connect(
      () => {
        setIsConnected(true);
        console.log('Socket connected successfully');
      },
      (error) => {
        setIsConnected(false);
        console.error('Socket connection error:', error);
      }
    );

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
      setIsConnected(false);
    };
  }, []);

  // Subscribe to a room and receive messages
  const subscribeToRoom = useCallback((roomId, onMessage) => {
    if (!isConnected) {
      console.warn('Socket not connected. Cannot subscribe to room.');
      return null;
    }

    const subscription = socketService.subscribeToRoom(roomId, (message) => {
      setMessages((prev) => [...prev, message]);
      if (onMessage) {
        onMessage(message);
      }
    });

    return subscription;
  }, [isConnected]);

  // Unsubscribe from a room
  const unsubscribeFromRoom = useCallback((roomId) => {
    socketService.unsubscribeFromRoom(roomId);
    // Clear messages for this room if needed
    setMessages((prev) => prev.filter((msg) => msg.roomId !== roomId));
  }, []);

  // Send a message to a room
  const sendMessage = useCallback((roomId, content, sender = null) => {
    const senderName = sender || 'Anonymous';
    socketService.sendMessage(roomId, content, senderName);
  }, []);

  // Get messages for a specific room
  const getRoomMessages = useCallback((roomId) => {
    return messages.filter((msg) => msg.roomId === roomId);
  }, [messages]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const value = {
    isConnected,
    messages,
    subscribeToRoom,
    unsubscribeFromRoom,
    sendMessage,
    getRoomMessages,
    clearMessages,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

