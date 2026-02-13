# RoomNMeal Backend

Node.js + Express + MongoDB backend for RoomNMeal application.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Start development server:
```bash
npm run dev
```

Server runs on http://localhost:5000

## Environment Variables

Required variables in `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/roomnmeal
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

## Database Models

- **User**: Authentication and user profiles
- **Room**: Room listings with location and facilities
- **MessPlan**: Mess service plans with menu
- **Booking**: Student bookings for rooms/mess
- **Payment**: Razorpay payment records

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server

## API Structure

All routes are prefixed with `/api`

- `/api/auth` - Authentication routes
- `/api/rooms` - Room management
- `/api/mess` - Mess plan management
- `/api/bookings` - Booking operations
- `/api/payments` - Payment processing
- `/api/admin` - Admin operations
