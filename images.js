const mongo = require('mongo');

const imageSchema = new mongo.Schema({
  room: String,
  sender: String,
  role: String,
  type: { type: String, default: 'image' },
  data: Buffer,        
  contentType: String,    
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongo.model('Image', imageSchema);
