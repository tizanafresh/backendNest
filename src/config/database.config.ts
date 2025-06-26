import { MongooseModuleOptions } from '@nestjs/mongoose';
import { appConfig } from './app.config';

export const databaseConfig: MongooseModuleOptions = {
  uri: appConfig.database.uri,
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
