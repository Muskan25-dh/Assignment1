const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Users
const users = [
  { id: 1, username: "alex", email: "alex@com.au", pwd: "123456yhgfr34567uhgfvder", role: "superadmin" },
  { id: 2, username: "sam", email: "sam@com.au", pwd: "13456", role: "groupadmin" },
  { id: 3, username: "simran", email: "simran@com.au", pwd: "1234", role: "user" },
  { id: 4, username: "chelisa", email: "chelisa@com.au", pwd: "er33243@jformd", role: "user" }
];

// Login route
app.post('/api/auth', (req, res) => {
  const { email, pwd } = req.body;
  if (!email || !pwd) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  const user = users.find(u => u.email === email && u.pwd === pwd);

  if (user) {
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Create server
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Track members in rooms
const roomMembers = {};

// Socket.IO events
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

//only superadmin can create group
const rooms = new Set();

socket.on('createRoom', ({ roomName }) => {
  const member = roomMembers[socket.id];
  if (member && member.role === 'superadmin') {
    rooms.add(roomName);
    io.emit('roomCreated', roomName);
  } else {
    socket.emit('error', 'Only superadmin can create rooms');
  }
});


  // Join room 
  socket.on('joinRoom', ({ roomName, username, role }) => {
    socket.join(roomName);
    roomMembers[socket.id] = { roomName, username, role };
    console.log(`${username} with role ${role} joined room: ${roomName}`);

    // Get all members in the room
    const membersInRoom = Object.entries(roomMembers)
        .filter(([id, member]) => member.roomName === roomName)
        .map(([id, member]) => ({ id, username: member.username, role: member.role }));

    // Emit to all in the room
    io.to(roomName).emit('userJoined', { username, role, members: membersInRoom });
});


  // Sending message to room
  socket.on('newmsg', ({ room, message }) => {
    const member = roomMembers[socket.id];
    if (member && member.roomName === room) {
      io.to(room).emit('newmsg', `[${member.role}] ${member.username}: ${message}`);
    }
  });

  // Kicking member out (only admins)
  socket.on('kickMember', (targetID) => {
    const member = roomMembers[socket.id];
      const targetMember = roomMembers[targetID]; 

    if (member && (member.role === 'superadmin' || member.role === 'groupadmin')) {
      const targetSocket = io.sockets.sockets.get(targetID);
      if (targetSocket) {
        const targetMember = roomMembers[targetID];
        targetSocket.leave(targetMember.roomName);
        io.to(targetMember.roomName).emit(
          'newmsg',
          `User ${targetMember.username} has been kicked out by ${member.username}`
        );
        targetSocket.emit('kicked');
        delete roomMembers[targetID];
      }
    }
  });

  // Disconnecting user
  socket.on('disconnect', () => {
    const member = roomMembers[socket.id];
    if (member) {
      io.to(member.roomName).emit('userLeft', { username: member.username, role: member.role });
      delete roomMembers[socket.id];
    }
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server has started on port: ${PORT}`);
});

function updateRoomMembers(roomName) {
  const members = Object.entries(roomMembers)
    .filter(([id, m]) => m.roomName === roomName)
    .map(([id, m]) => ({ id, username: m.username, role: m.role }));

  io.to(roomName).emit('membersUpdate', members);
}
