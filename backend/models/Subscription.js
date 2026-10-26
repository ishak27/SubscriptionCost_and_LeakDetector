const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, required: true, trim: true, maxlength: 60 },
  cost: { type: Number, required: true, min: 0.01 },
  billingCycle: { type: String, enum: ['weekly', 'monthly', 'yearly'], required: true },
  renewalDate: { type: Date, required: true },
  paymentMethod: { type: String, trim: true, default: '' },
  cardLast4: { type: String, match: [/^$|^\d{4}$/, 'Enter only the last four digits'], default: '' }
}, { timestamps: true, toJSON: { virtuals: true, transform: (_doc, ret) => { ret.id = ret._id.toString(); if (ret.renewalDate) ret.renewalDate = new Date(ret.renewalDate).toISOString().slice(0, 10); delete ret._id; delete ret.__v; return ret; } } });

module.exports = mongoose.model('Subscription', subscriptionSchema);
