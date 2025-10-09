const mongo = require('mongo');

const messageSchema = new mongoose.Schema({
  room: { type: String, required: true },
  sender: { type: String, required: true },      
  role: { type: String, required: true },        
  type: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
  content: { type: String, required: true },     
});

module.exports = mongoose.model('Message', messageSchema);
