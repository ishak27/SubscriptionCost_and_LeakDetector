require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

async function main() {
  const [name, emailArg, password] = process.argv.slice(2);
  const email = String(emailArg || '').trim().toLowerCase();
  if (!name || !email || !password || password.length < 8) {
    console.error('Usage: npm run create-admin -- "Admin Name" admin@example.com "StrongPassword123"');
    process.exitCode = 1; return;
  }
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'coveDB' });
  const existing = await User.findOne({ email });
  if (existing) {
    console.error('That email already exists. Use a different email or update the account manually.');
    await mongoose.disconnect(); process.exitCode = 1; return;
  }
  await User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'admin' });
  console.log('Admin account created. Keep these credentials private.');
  await mongoose.disconnect();
}
main().catch(async error => { console.error(error.message); await mongoose.disconnect(); process.exitCode = 1; });
