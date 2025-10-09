const mongo = require('mongo');

const userSchema = new mongo.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  pwd: { type: String, required: true },
  avatar: { type: String, default: null },
  valid: { type: Boolean, default: true },
  role: { type: String, enum: ['superadmin', 'groupadmin', 'user'], default: 'user' }
});

module.exports = mongo.model('User', userSchema);
