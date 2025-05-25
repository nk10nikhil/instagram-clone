const { createServer } = require('http');
const { Server } = require('socket.io');
const { MongoClient } = require('mongodb');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// MongoDB connection
let db;
if (process.env.MONGODB_URI) {
  MongoClient.connect(process.env.MONGODB_URI)
    .then(client => {
      console.log('Connected to MongoDB');
      db = client.db('instagramclone');
    })
    .catch(error => console.error('MongoDB connection error:', error));
} else {
  console.log('MongoDB URI not found. Socket server will run without database features.');
}

// Store online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user authentication
  socket.on('authenticate', (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);

    // Update user online status in database
    if (db) {
      db.collection('users').updateOne(
        { _id: new require('mongodb').ObjectId(userId) },
        { $set: { isOnline: true, lastSeen: new Date() } }
      );
    }

    // Join user to their personal room
    socket.join(userId);

    // Notify friends that user is online
    socket.broadcast.emit('user_online', userId);
  });

  // Handle private messages
  socket.on('send_message', async (data) => {
    const { conversationId, senderId, content, messageType, media } = data;

    try {
      // Save message to database
      const message = {
        conversationId: new require('mongodb').ObjectId(conversationId),
        senderId: new require('mongodb').ObjectId(senderId),
        content,
        messageType: messageType || 'text',
        media,
        reactions: [],
        isEdited: false,
        isDeleted: false,
        readBy: [{ userId: new require('mongodb').ObjectId(senderId), readAt: new Date() }],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (db) {
        const result = await db.collection('messages').insertOne(message);
        message._id = result.insertedId;

        // Update conversation last message
        await db.collection('conversations').updateOne(
          { _id: new require('mongodb').ObjectId(conversationId) },
          {
            $set: {
              lastMessage: result.insertedId,
              lastMessageAt: new Date()
            }
          }
        );

        // Get conversation participants
        const conversation = await db.collection('conversations').findOne({
          _id: new require('mongodb').ObjectId(conversationId)
        });

        if (conversation) {
          // Send message to all participants
          conversation.participants.forEach(participantId => {
            const participantSocketId = onlineUsers.get(participantId.toString());
            if (participantSocketId) {
              io.to(participantSocketId).emit('new_message', message);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle message read status
  socket.on('mark_as_read', async (data) => {
    const { messageId, userId } = data;

    try {
      if (db) {
        await db.collection('messages').updateOne(
          { _id: new require('mongodb').ObjectId(messageId) },
          {
            $addToSet: {
              readBy: {
                userId: new require('mongodb').ObjectId(userId),
                readAt: new Date()
              }
            }
          }
        );

        // Notify sender that message was read
        const message = await db.collection('messages').findOne({
          _id: new require('mongodb').ObjectId(messageId)
        });

        if (message) {
          const senderSocketId = onlineUsers.get(message.senderId.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('message_read', { messageId, userId });
          }
        }
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle typing indicators
  socket.on('typing_start', (data) => {
    const { conversationId, userId } = data;
    socket.to(conversationId).emit('user_typing', { userId, isTyping: true });
  });

  socket.on('typing_stop', (data) => {
    const { conversationId, userId } = data;
    socket.to(conversationId).emit('user_typing', { userId, isTyping: false });
  });

  // Handle video/voice calls
  socket.on('call_user', (data) => {
    const { to, from, callType, offer } = data;
    const targetSocketId = onlineUsers.get(to);

    if (targetSocketId) {
      io.to(targetSocketId).emit('incoming_call', {
        from,
        callType,
        offer
      });
    }
  });

  socket.on('answer_call', (data) => {
    const { to, answer } = data;
    const targetSocketId = onlineUsers.get(to);

    if (targetSocketId) {
      io.to(targetSocketId).emit('call_answered', { answer });
    }
  });

  socket.on('reject_call', (data) => {
    const { to } = data;
    const targetSocketId = onlineUsers.get(to);

    if (targetSocketId) {
      io.to(targetSocketId).emit('call_rejected');
    }
  });

  socket.on('end_call', (data) => {
    const { to } = data;
    const targetSocketId = onlineUsers.get(to);

    if (targetSocketId) {
      io.to(targetSocketId).emit('call_ended');
    }
  });

  // Handle ICE candidates for WebRTC
  socket.on('ice_candidate', (data) => {
    const { to, candidate } = data;
    const targetSocketId = onlineUsers.get(to);

    if (targetSocketId) {
      io.to(targetSocketId).emit('ice_candidate', { candidate });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    if (socket.userId) {
      onlineUsers.delete(socket.userId);

      // Update user offline status in database
      if (db) {
        db.collection('users').updateOne(
          { _id: new require('mongodb').ObjectId(socket.userId) },
          { $set: { isOnline: false, lastSeen: new Date() } }
        );
      }

      // Notify friends that user is offline
      socket.broadcast.emit('user_offline', socket.userId);
    }
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
