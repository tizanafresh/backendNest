export const appConfig = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Base de datos
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tizanafresh',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  
  // Email
  email: {
    mailer: process.env.MAIL_MAILER || 'smtp',
    host: process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '587', 10),
    username: process.env.MAIL_USERNAME || process.env.SMTP_USER || 'hernandomiguel.1994micuenta@gmail.com',
    password: process.env.MAIL_PASSWORD || process.env.SMTP_PASS || 'uvptuyandrydurwp',
    encryption: process.env.MAIL_ENCRYPTION || 'tls',
    fromAddress: process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_FROM || 'hernandomiguel.1994micuenta@gmail.com',
    fromName: process.env.MAIL_FROM_NAME || 'Tizanas Fresh',
    secure: process.env.MAIL_ENCRYPTION === 'ssl' || process.env.SMTP_SECURE === 'true',
    
    // Ethereal Email para desarrollo
    ethereal: {
      user: process.env.ETHEREAL_USER || 'test@ethereal.email',
      pass: process.env.ETHEREAL_PASS || 'test123',
    },
  },
  
  // Aplicación
  app: {
    name: process.env.APP_NAME || 'Tizanas Fresh',
    url: process.env.APP_URL || 'http://localhost:5001',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  
  // Seguridad
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    passwordResetExpiresIn: parseInt(process.env.PASSWORD_RESET_EXPIRES_IN || '3600000', 10), // 1 hora
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  
  // Rate Limiting
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
  },
  
  // Validación
  validation: {
    transform: process.env.VALIDATION_PIPE_TRANSFORM === 'true',
    whitelist: process.env.VALIDATION_PIPE_WHITELIST === 'true',
    forbidNonWhitelisted: process.env.VALIDATION_PIPE_FORBID_NON_WHITELISTED === 'true',
  },
  
  // Paginación
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  },
  
  // Archivos
  upload: {
    dest: process.env.UPLOAD_DEST || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  },
  
  // Notificaciones (Futuro)
  notifications: {
    fcm: {
      serverKey: process.env.FCM_SERVER_KEY || 'your-fcm-server-key',
      projectId: process.env.FCM_PROJECT_ID || 'your-fcm-project-id',
    },
  },
  
  // Pagos (Futuro)
  payments: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret',
    },
    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID || 'your_paypal_client_id',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'your_paypal_client_secret',
    },
  },
  
  // Redes Sociales (Futuro)
  social: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'your_google_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your_google_client_secret',
    },
    facebook: {
      appId: process.env.FACEBOOK_APP_ID || 'your_facebook_app_id',
      appSecret: process.env.FACEBOOK_APP_SECRET || 'your_facebook_app_secret',
    },
  },
  
  // Monitoreo (Futuro)
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN || 'your_sentry_dsn',
    },
    newRelic: {
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY || 'your_new_relic_license_key',
    },
  },
  
  // Cache (Futuro)
  cache: {
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD || 'your_redis_password',
    },
  },
  
  // Colas (Futuro)
  queue: {
    connection: process.env.QUEUE_CONNECTION || 'redis',
    host: process.env.QUEUE_HOST || 'localhost',
    port: parseInt(process.env.QUEUE_PORT || '6379', 10),
    password: process.env.QUEUE_PASSWORD || 'your_queue_password',
  },
};
