const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI || mongoURI.includes('localhost:27017')) {
      console.log('ℹ️  No MongoDB Atlas URI provided in backend/.env. Running with in-memory fallback dataset.');
      return;
    }
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️  MongoDB Connection Notice: ${error.message}`);
    console.warn('ℹ️  Running backend API with in-memory fallback dataset.');
  }
};

module.exports = connectDB;
