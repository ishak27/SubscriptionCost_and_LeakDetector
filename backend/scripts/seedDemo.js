require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Budget = require('../models/Budget');

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Add MONGODB_URI to backend/.env first.');
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'coveDB' });

  const email = 'user@demo.com';
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ name: 'Demo User', email, password: await bcrypt.hash('user123', 10), role: 'user' });
    console.log('Created demo account: user@demo.com / user123');
  } else {
    console.log('Demo account already exists; leaving its account data unchanged.');
  }

  const existingCount = await Subscription.countDocuments({ user: user._id });
  if (existingCount === 0) {
    const subscriptions = [
      { name: 'Spotify', category: 'Music', cost: 119, billingCycle: 'monthly', renewalDate: '2026-11-05', paymentMethod: 'UPI', cardLast4: '' },
      { name: 'Apple Music', category: 'Music', cost: 99, billingCycle: 'monthly', renewalDate: '2026-11-08', paymentMethod: 'Credit Card', cardLast4: '4521' },
      { name: 'Netflix', category: 'Video', cost: 649, billingCycle: 'monthly', renewalDate: '2026-11-12', paymentMethod: 'Credit Card', cardLast4: '7788' },
      { name: 'Prime Video', category: 'Video', cost: 1499, billingCycle: 'yearly', renewalDate: '2027-01-15', paymentMethod: 'UPI', cardLast4: '' }
    ].map(item => ({ ...item, user: user._id }));
    await Subscription.insertMany(subscriptions);
    console.log('Inserted four sample subscriptions.');
  } else {
    console.log('Demo account already has subscriptions; no sample subscriptions were added.');
  }

  const budget = await Budget.findOne({ user: user._id });
  if (!budget) await Budget.create({ user: user._id, monthlyBudget: 3200, currency: 'INR' });
  console.log('Demo data setup complete.');
  await mongoose.disconnect();
}
main().catch(async error => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
