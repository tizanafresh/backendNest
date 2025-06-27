import { MongooseModuleOptions } from '@nestjs/mongoose';

export const databaseConfig: MongooseModuleOptions = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tizanafresh',
  connectionFactory: (connection) => {
    connection.on('connected', () => {
      console.log('✅ MongoDB conectado exitosamente');
    });
    
    connection.on('error', (error) => {
      console.error('❌ Error de conexión a MongoDB:', error);
    });
    
    connection.on('disconnected', () => {
      console.log('⚠️ MongoDB desconectado');
    });
    
    return connection;
  },
};
