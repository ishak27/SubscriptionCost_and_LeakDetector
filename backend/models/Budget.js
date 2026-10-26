const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  monthlyBudget: { type: Number, required: true, min: 0.01 },
  currency: { type: String, enum: ['INR', 'USD', 'EUR', 'GBP'], default: 'INR' }
}, { timestamps: true });

module.exports = mongoose.model('Budget', budgetSchema);
