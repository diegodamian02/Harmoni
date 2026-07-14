require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const { verifyToken } = require('./utils/jwt');
const User = require('./models/User');
const Message = require('./models/Message');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const matchRoutes = require('./routes/match');
const messageRoutes = require('./routes/messages');
const waitlistRoutes = require('./routes/waitlist');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).select('_id displayName');
    if (!user) return next(new Error('User not found'));
    socket.data.user = user;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.user._id.toString();
  socket.join(userId);

  socket.on('send_message', async ({ receiverId, text }) => {
    if (!receiverId || !text?.trim()) return;
    try {
      const msg = await Message.create({
        senderId: socket.data.user._id,
        receiverId,
        text: text.trim(),
      });
      io.to(receiverId).emit('new_message', msg);
      socket.emit('new_message', msg);
    } catch (err) {
      console.error('Socket message error:', err);
    }
  });

  socket.on('disconnect', () => socket.leave(userId));
});

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/match', matchRoutes);
app.use('/messages', messageRoutes);
app.use('/waitlist', waitlistRoutes);

app.get('/', (req, res) => res.send('Harmoni API'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8333;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
