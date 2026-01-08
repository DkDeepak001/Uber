# Socket Client Usage Guide

## Overview
The React client now includes WebSocket support using STOMP over SockJS to connect to the Spring Boot socket service.

## Setup

### 1. Socket Service Configuration
Make sure your socket service is running. The default configuration expects:
- **Endpoint**: `/ws-uber`
- **Port**: `8080` (default Spring Boot port)
- **Protocol**: STOMP over SockJS

### 2. Environment Variables (Optional)
You can set a custom socket URL using environment variables:
```bash
# Create a .env file in the client directory
VITE_SOCKET_URL=http://localhost:8080/ws-uber
```

## Usage

### Basic Usage in a Component

```jsx
import { useSocket } from '../contexts/SocketContext';

function MyComponent() {
  const { isConnected, sendMessage, subscribeToRoom, unsubscribeFromRoom } = useSocket();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to a room (e.g., booking ID or chat room)
    const roomId = 'booking-123';
    const subscription = subscribeToRoom(roomId, (message) => {
      setMessages(prev => [...prev, message]);
      console.log('New message:', message);
    });

    // Cleanup on unmount
    return () => {
      unsubscribeFromRoom(roomId);
    };
  }, [isConnected, subscribeToRoom, unsubscribeFromRoom]);

  const handleSend = () => {
    sendMessage('booking-123', 'Hello!', 'user@example.com');
  };

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={handleSend}>Send Message</button>
    </div>
  );
}
```

### Using the Chat Component

The `Chat` component is a ready-to-use example:

```jsx
import Chat from '../components/Chat';

function BookingPage({ bookingId }) {
  return (
    <div>
      <h1>Booking Chat</h1>
      <Chat roomId={bookingId} />
    </div>
  );
}
```

## Socket Service API

### Message Format

**Send Message:**
```javascript
{
  content: "Hello world",
  sender: "user@example.com",
  roomId: "booking-123"
}
```

**Receive Message:**
```javascript
{
  content: "Message received successfully from user@example.com: Hello world",
  sender: "user@example.com"
}
```

### Available Methods

- `isConnected`: Boolean indicating connection status
- `subscribeToRoom(roomId, callback)`: Subscribe to messages in a room
- `unsubscribeFromRoom(roomId)`: Unsubscribe from a room
- `sendMessage(roomId, content, sender)`: Send a message to a room
- `getRoomMessages(roomId)`: Get all messages for a room
- `clearMessages()`: Clear all stored messages

## Integration Example

Add the Chat component to your booking details page:

```jsx
// In BookingDetails.jsx or DriverBookingDetails.jsx
import Chat from '../components/Chat';
import { useParams } from 'react-router-dom';

function BookingDetails() {
  const { id } = useParams();
  
  return (
    <div>
      {/* Your existing booking details */}
      <Chat roomId={`booking-${id}`} />
    </div>
  );
}
```

## Troubleshooting

1. **Connection fails**: Check that the socket service is running and the URL is correct
2. **Messages not received**: Verify you're subscribed to the correct room ID
3. **CORS errors**: Ensure CORS is configured in the socket service (already done in SocketConfig.java)

