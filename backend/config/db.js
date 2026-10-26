const mongoose = require('mongoose');

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add it to backend/.env.');
  }

  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'coveDB' });
  console.log('MongoDB connected:', mongoose.connection.name);
}

module.exports = connectDB;
