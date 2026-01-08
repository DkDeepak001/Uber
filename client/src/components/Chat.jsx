import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import './Chat.css';

const Chat = ({ roomId }) => {
  const [message, setMessage] = useState('');
  const [roomMessages, setRoomMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const { isConnected, sendMessage, subscribeToRoom, unsubscribeFromRoom } = useSocket();
  const { user, userType } = useAuth();

  useEffect(() => {
    if (!roomId || !isConnected) return;

    // Subscribe to room messages
    const subscription = subscribeToRoom(roomId, (newMessage) => {
      setRoomMessages((prev) => [...prev, newMessage]);
    });

    // Cleanup subscription on unmount or room change
    return () => {
      if (subscription) {
        unsubscribeFromRoom(roomId);
      }
    };
  }, [roomId, isConnected, subscribeToRoom, unsubscribeFromRoom]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !isConnected) return;

    const sender = user?.email || userType || 'Anonymous';
    sendMessage(roomId, message, sender);
    setMessage('');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat Room: {roomId}</h3>
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </span>
      </div>

      <div className="messages-container">
        {roomMessages.length === 0 ? (
          <div className="no-messages">No messages yet. Start the conversation!</div>
        ) : (
          roomMessages.map((msg, index) => (
            <div key={index} className="message">
              <div className="message-sender">{msg.sender}</div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          disabled={!isConnected}
          className="chat-input"
        />
        <button type="submit" disabled={!isConnected || !message.trim()} className="send-button">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;

