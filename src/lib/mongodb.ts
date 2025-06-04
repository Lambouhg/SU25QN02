import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

export async function connectDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    const conn = await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Connected');
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}
