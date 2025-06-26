import { MongooseModuleOptions } from '@nestjs/mongoose';

export const databaseConfig: MongooseModuleOptions = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tizanafresh',
  connectionFactory: (connection) => {
    connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });
    
    connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });
    
    connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    return connection;
  },
} as MongooseModuleOptions; 