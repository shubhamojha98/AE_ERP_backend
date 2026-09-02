import socketService from '../services/socket-service';

// after login success:
socketService.notifyUser(user.id, {
  title: 'Login successful',
  message: 'Welcome back to the Municipal Portal',
  type: 'success',
  data: { route: '/dashboard' },
});



socketService.emitToRoom('admins', {
  title: 'User password reset',
  message: `User ${username} reset password`,
  type: 'info'
});



# Client-side reminders

socket.emit('registerUser', userId);
socket.on('notification', payload => showToast(payload));


socket.emit('joinUser', String(userId));
socket.on('notification', payload => showToast(payload));
socket.on('presence', p => updatePresenceUI(p));


import socketService from '../../services/socket-service'; // adjust path

// After password updated and attempt record cleared
// 1) Notify the user
try {
  socketService.notifyUser(user.id, {
    title: 'Password changed',
    message: 'Your password was successfully changed. If this wasn’t you, contact support immediately.',
    type: 'warning',
    data: { event: 'password_reset' }
  });
} catch (err) {
  console.warn('User notification (password reset) failed:', err);
}

// 2) Notify admins only
try {
  socketService.emitToRoom('admins', {
    title: 'User password reset',
    message: `User ${user.username} (id:${user.id}) reset their password.`,
    type: 'info',
    data: { userId: user.id, event: 'password_reset' }
  });
} catch (err) {
  console.warn('Admin notification (password reset) failed:', err);
}

// Respond to HTTP request (your existing response)
return genrateResponse(res, HttpStatus.OK, "Password reset successful");



import { io } from "socket.io-client";
import { toast } from "react-toastify"; // example

const token = localStorage.getItem('token'); // JWT from login

const socket = io(process.env.REACT_APP_API_URL || 'https://api.example.com', {
  auth: { token: 'Bearer ' + token },
  withCredentials: true
});

socket.on('connect', () => console.log('Admin socket connected', socket.id));

socket.on('notification', (payload) => {
  // payload: { title, message, type, data, timestamp }
  toast(payload.message || payload.title, { type: payload.type || 'info' });
});

socket.emit('registerUser', adminUserId); // legacy
// or
socket.emit('joinUser', String(adminUserId)); // modern
socket.emit('joinRoom', 'admins'); // only if you implemented a handler on server


import jwt from 'jsonwebtoken';
// assume JWT_SECRET is set in env
const JWT_SECRET = process.env.JWT_SECRET || 'replace-me';

this.io.use((socket, next) => {
  try {
    const tokenFromAuth = socket.handshake.auth?.token as string | undefined;
    const headerToken = (socket.handshake.headers?.authorization || socket.handshake.headers?.['x-access-token']) as string | undefined;
    const raw = tokenFromAuth ?? headerToken;
    if (!raw) return next(); // allow anonymous socket

    const token = raw.startsWith('Bearer ') ? raw.split(' ')[1] : raw;
    const decoded = jwt.verify(token, String(JWT_SECRET)) as any;
    (socket as any).authUser = decoded;
    return next();
  } catch (err) {
    // allow connection but unauthenticated; or call next(new Error('Auth error')) to reject
    return next();
  }
});


await panel.notifications.create({
  data: {
    room: 'admins',
    title: 'User login',
    message: `User ${user.username} logged in.`,
    data: { userId: user.id, event: 'login' },
    level: 'info'
  }
});




import { io } from "socket.io-client";
import { toast } from "react-toastify";

const token = localStorage.getItem("token"); // your admin login token

// Connect with JWT so server can auto-join admin rooms
const socket = io("YOUR_BACKEND_URL", {
  auth: { token: "Bearer " + token },
  withCredentials: true
});

socket.on("connect", () => {
  console.log("Admin connected:", socket.id);

  // Optional fallback if you don’t use JWT auto-join
  socket.emit("joinUser", String(adminUserId));
  socket.emit("joinRoom", "admins"); // only if you implemented joinRoom
});

socket.on("notification", (payload) => {
  console.log("ADMIN NOTIFICATION:", payload);
  toast(payload.message, { type: payload.type || "info" });
});


db table

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    room VARCHAR(50) NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    data JSONB NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);
