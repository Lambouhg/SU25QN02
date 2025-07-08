import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Connection options với timeout tối ưu
const options = {
  bufferCommands: false,
  serverSelectionTimeoutMS: 5000, // 5 seconds
  socketTimeoutMS: 45000, // 45 seconds
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  connectTimeoutMS: 10000, // 10 seconds
};

export async function connectDB() {
  try {
    // Nếu đã connected, return luôn
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // Nếu đang connecting, đợi
    if (mongoose.connection.readyState === 2) {
      await new Promise(resolve => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', resolve);
      });
      return mongoose.connection;
    }

    // Kiểm tra MONGODB_URI
    const conn = await mongoose.connect(MONGODB_URI, options);
    return conn;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    console.error('📋 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as unknown as { code?: string })?.code,
      codeName: (error as unknown as { codeName?: string })?.codeName
    });
    
    // Disconnect nếu có lỗi để reset connection state
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    throw error;
  }
}
