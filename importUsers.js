const mongoose = require('mongoose');
const fs = require('fs');
const User = require('./user-class'); // your Mongoose model

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/chatapp')
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

(async () => {
  try {
    // Clear existing users
    await User.deleteMany({});
    console.log("Existing users cleared");

    // Read and map users
    const users = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
    const mappedUsers = users
      .filter(u => u.name && u.email && u.password) // only valid users
      .map(u => ({
        username: u.name,
        email: u.email,
        pwd: u.password,
        role: u.role || 'user'
      }));

    // Insert users
    await User.insertMany(mappedUsers);
    console.log(`Imported ${mappedUsers.length} users successfully`);

  } catch (err) {
    console.error("Error importing users:", err);
  } finally {
    mongoose.disconnect();
  }
})();
