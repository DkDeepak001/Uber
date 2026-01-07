# Uber Frontend Application

A complete React frontend application for the Uber ride-sharing service.

## Features

- **User Authentication**: Sign up and sign in for both users and drivers
- **Booking System**: Create, view, and manage ride bookings
- **Location Services**: Select pickup and dropoff locations on map
- **Driver Dashboard**: Manage availability and view assigned rides
- **Review System**: Rate and review completed rides
- **Responsive Design**: Modern, mobile-friendly UI

## Tech Stack

- React 19
- React Router DOM
- Axios for API calls
- Vite for build tooling
- CSS3 for styling

## Getting Started

### Prerequisites

- Node.js 18+ (recommended 20+)
- npm or yarn

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable components (Map, etc.)
├── contexts/        # React contexts (AuthContext)
├── pages/           # Page components
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   ├── DriverDashboard.jsx
│   ├── BookRide.jsx
│   └── BookingDetails.jsx
├── services/        # API service layer
│   └── api.js
├── utils/          # Utility functions
├── hooks/          # Custom React hooks
├── App.jsx         # Main app component with routing
└── main.jsx        # Entry point
```

## API Configuration

The API endpoints are configured in `src/services/api.js`. By default, they point to:

- Auth Service: `http://localhost:8000`
- Location Service: `http://localhost:8001`
- Booking Service: `http://localhost:8002`
- Review Service: `http://localhost:8003`

Make sure all backend services are running before using the frontend.

## Features Overview

### User Features
- Sign up / Sign in
- Book a ride with pickup and dropoff locations
- View booking history
- Review completed rides
- View booking details

### Driver Features
- Sign up / Sign in
- Toggle availability status
- View assigned bookings
- Update location (automatically when available)

## Routes

- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - User dashboard (protected)
- `/driver/dashboard` - Driver dashboard (protected)
- `/book` - Book a ride (protected, user only)
- `/booking/:id` - Booking details (protected, user only)

## Authentication

The app uses JWT tokens stored in localStorage. The token is automatically included in API requests via the `setAuthToken` function in the API service.

## Notes

- The map component is a placeholder. For production, integrate with Google Maps or Mapbox.
- User/Driver IDs are currently stored in localStorage. In production, these should come from the JWT token payload.
- The application includes error handling and loading states for better UX.
