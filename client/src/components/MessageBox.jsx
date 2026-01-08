import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import './MessageBox.css';

const MessageBox = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [roomId, setRoomId] = useState('test-room');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const { isConnected, sendMessage, subscribeToRoom, unsubscribeFromRoom } = useSocket();
  const { user, userType } = useAuth();

  useEffect(() => {
    if (!roomId || !isConnected) return;

    // Subscribe to room messages
    const subscription = subscribeToRoom(roomId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
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
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || !isConnected) return;

    const sender = user?.email || userType || 'Anonymous';
    sendMessage(roomId, message, sender);
    setMessage('');
  };

  const handleRoomChange = (e) => {
    const newRoomId = e.target.value.trim() || 'test-room';
    setRoomId(newRoomId);
    setMessages([]); // Clear messages when changing room
  };

  return (
    <div className={`message-box ${isExpanded ? 'expanded' : ''}`}>
      <div className="message-box-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-content">
          <span className="message-box-title">Socket Test</span>
          <span className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`} title={isConnected ? 'Connected' : 'Disconnected'}>
            {isConnected ? '●' : '○'}
          </span>
          {!isConnected && (
            <span className="connection-text" style={{ fontSize: '10px', marginLeft: '4px' }}>
              Connecting...
            </span>
          )}
        </div>
        <button className="toggle-btn">{isExpanded ? '−' : '+'}</button>
      </div>

      {isExpanded && (
        <div className="message-box-content">
          <div className="room-selector">
            <label>Room ID:</label>
            <input
              type="text"
              value={roomId}
              onChange={handleRoomChange}
              placeholder="Enter room ID"
              className="room-input"
            />
          </div>

          <div className="messages-list">
            {messages.length === 0 ? (
              <div className="no-messages">No messages yet. Send a message to test!</div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className="message-item">
                  <div className="message-sender">{msg.sender}</div>
                  <div className="message-text">{msg.content}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="message-form">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              disabled={!isConnected}
              className="message-input"
            />
            <button 
              type="submit" 
              disabled={!isConnected || !message.trim()} 
              className="send-btn"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default MessageBox;

