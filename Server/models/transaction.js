const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  // 1. USER ID: Stores the email (e.g., "aditya@gmail.com")
  userId: { 
    type: String, 
    required: true, 
    index: true // Makes searching by user very fast
  },

  date: Date,
  description: String,
  amount: Number,
  category: String,
  type: String,

  // 2. UPI REF: Added 'sparse: true' for safety
  upi_ref: { 
    type: String, 
    unique: true, // No duplicate transactions allowed
    sparse: true  // <--- IMPORTANT: Allows transactions that might NOT have a ref (like bank charges)
  }
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

module.exports = mongoose.model('Transaction', TransactionSchema);