// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const { MongoClient, ObjectId } = require('mongodb');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// MongoDB setup
const mongoUrl = 'mongodb://127.0.0.1:27017';
const dbName = 'chatapp';
let db, usersCollection, messagesCollection, imagesCollection;

// Load fallback users from JSON
let localUsers = [];
if (fs.existsSync('data.json')) {
  localUsers = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
}

// MongoDB connection
MongoClient.connect(mongoUrl, { useUnifiedTopology: true })
  .then(client => {
    console.log('MongoDB connected');
    db = client.db(dbName);
    usersCollection = db.collection('users');
    messagesCollection = db.collection('messages');
    imagesCollection = db.collection('images');

    // Start server only after MongoDB is ready
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Login route
app.post('/api/auth', async (req, res) => {
  const { email, pwd } = req.body;
  if (!email || !pwd) return res.status(400).json({ success: false, message: 'Email and password required' });

  try {
    const user = await usersCollection.findOne({ email, pwd });
    if (user) {
      const { pwd, ...userData } = user;
      return res.json({ success: true, user: userData });
    }

    const localUser = localUsers.find(u => u.email === email && u.password === pwd);
    if (localUser) {
      return res.json({
        success: true,
        user: {
          username: localUser.name || 'Guest',
          email: localUser.email,
          role: localUser.role || 'user'
        }
      });
    }

    res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Image upload
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  try {
    const result = await imagesCollection.insertOne({
      filename: req.file.originalname,
      data: req.file.buffer,
      contentType: req.file.mimetype,
      createdAt: new Date()
    });

    const imageUrl = `http://localhost:${PORT}/api/images/${result.insertedId}`;
    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error('Failed to save image:', err);
    res.status(500).json({ success: false, message: 'Failed to save image' });
  }
});

// Serve image
app.get('/api/images/:id', async (req, res) => {
  try {
    const img = await imagesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!img) return res.status(404).send('Image not found');

    res.contentType(img.contentType);
    res.send(img.data.buffer || img.data);
  } catch (err) {
    res.status(500).send('Server error');
  }
});


const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET','POST'] } });

// In-memory room storage
const rooms = {}; // { roomName: { messages: [], members: { socketId: { username, role } } } }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  /// Join room
socket.on('joinRoom', async ({ roomName, username, role }) => {
  username = username || 'Guest';
  role = role || 'user';
  if (!roomName) return console.error('Missing room name');

  socket.join(roomName);
  if (!rooms[roomName]) rooms[roomName] = { messages: [], members: {} };
  rooms[roomName].members[socket.id] = { username, role };

  console.log(`${username} joined room: ${roomName} as ${role}`);

  
  const joinMsg = `[System] ${username} has joined the room.`;
  rooms[roomName].messages.push(joinMsg);
  io.to(roomName).emit('receiveMessage', joinMsg);

  
  try {
    const history = await messagesCollection.find({ room: roomName }).sort({ createdAt: 1 }).toArray();
    socket.emit('messageHistory', history);
  } catch (err) {
    console.error('Failed to fetch message history:', err);
  }
});


    // Update members list
    const membersArray = Object.entries(rooms[roomName].members).map(([id, m]) => ({
      id,
      socketId: id,
      username: m.username,
      role: m.role
    }));
    io.to(roomName).emit('membersUpdate', membersArray);
    io.to(roomName).emit('userJoined', { id: socket.id, username, role });
  });

  // Send text message
  socket.on('newmsg', async ({ room, message }) => {
    const member = rooms[room]?.members[socket.id];
    if (!member) return;

    const fullMsg = {
      room,
      sender: member.username,
      role: member.role,
      type: 'text',
      content: message,
      createdAt: new Date().toISOString()
    };

    rooms[room].messages.push(fullMsg);

    try {
      const result = await messagesCollection.insertOne(fullMsg);
      console.log('Text message saved:', result.insertedId);
    } catch (err) {
      console.error('Failed to save text message:', err);
    }

    io.to(room).emit('newmsg', fullMsg);
  });

  // Send image message
  socket.on('sendImage', async ({ room, imageUrl }) => {
    const member = rooms[room]?.members[socket.id];
    if (!member) return;

    const fullMsg = {
      room,
      sender: member.username,
      role: member.role,
      type: 'image',
      content: imageUrl,
      createdAt: new Date().toISOString()
    };

    rooms[room].messages.push(fullMsg);

    try {
      const result = await messagesCollection.insertOne(fullMsg);
      console.log('Image message saved:', result.insertedId);
    } catch (err) {
      console.error('Failed to save image message:', err);
    }

    io.to(room).emit('newmsg', fullMsg);
  });

  // Kick member
  socket.on('kickMember', (targetSocketId) => {
    for (const roomName in rooms) {
      const actor = rooms[roomName].members[socket.id];
      const target = rooms[roomName].members[targetSocketId];
      if (!actor || !target) continue;

      if (actor.role === 'superadmin' || (actor.role === 'groupadmin' && target.role !== 'superadmin')) {
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.leave(roomName);
          targetSocket.emit('kicked');
          io.to(roomName).emit('newmsg', {
            type: 'text',
            sender: 'System',
            role: 'system',
            content: `${target.username} was kicked by ${actor.username}`,
            createdAt: new Date().toISOString()
          });
          delete rooms[roomName].members[targetSocketId];

          const membersArray = Object.entries(rooms[roomName].members).map(([id, m]) => ({
            id,
            socketId: id,
            username: m.username,
            role: m.role
          }));
          io.to(roomName).emit('membersUpdate', membersArray);
        }
      } else {
        socket.emit('error', { message: 'Not authorized to kick this user' });
      }
    }
  });

  // Promote member
  socket.on('promoteUser', ({ targetSocketId }) => {
    for (const roomName in rooms) {
      const actor = rooms[roomName].members[socket.id];
      const target = rooms[roomName].members[targetSocketId];
      if (!actor || !target) continue;

      if (actor.role === 'superadmin' || (actor.role === 'groupadmin' && target.role !== 'superadmin')) {
        target.role = 'groupadmin';
        io.to(roomName).emit('userPromoted', { socketId: targetSocketId, username: target.username });

        const membersArray = Object.entries(rooms[roomName].members).map(([id, m]) => ({
          id,
          socketId: id,
          username: m.username,
          role: m.role
        }));
        io.to(roomName).emit('membersUpdate', membersArray);
      } else {
        socket.emit('error', { message: 'Not authorized to promote this user' });
      }
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    for (const roomName in rooms) {
      const member = rooms[roomName].members[socket.id];
      if (member) {
        const { username, role } = member;
        delete rooms[roomName].members[socket.id];

        io.to(roomName).emit('userLeft', { id: socket.id, username, role });

        const membersArray = Object.entries(rooms[roomName].members).map(([id, m]) => ({
          id,
          socketId: id,
          username: m.username,
          role: m.role
        }));
        io.to(roomName).emit('membersUpdate', membersArray);
      }
    }
    console.log('User disconnected:', socket.id);
  });
