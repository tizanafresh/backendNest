# 🍹 Tizanas Fresh - Backend API

Backend desarrollado en NestJS con MongoDB para la aplicación Tizanas Fresh, una plataforma de venta de tizanas y bebidas saludables.

## 🚀 Características

- **Autenticación JWT** completa con registro, login y recuperación de contraseña
- **Sistema de usuarios** con niveles de acceso y gestión de perfiles
- **Gestión de productos** con categorías, búsqueda y filtros
- **Sistema de pedidos** con estados y cálculos automáticos
- **Sistema de fidelización** con puntos y recompensas
- **Notificaciones push** para dispositivos móviles
- **API RESTful** documentada con casos de uso
- **Validación de datos** con class-validator
- **Logging** completo para debugging y monitoreo
- **Configuración centralizada** con variables de entorno

## 🛠️ Stack Tecnológico

- **Framework**: NestJS
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: class-validator, class-transformer
- **Email**: Nodemailer con SMTP
- **Encriptación**: bcrypt
- **Documentación**: HTML con casos de uso detallados

## 📋 Prerrequisitos

- Node.js (v18 o superior)
- MongoDB (local o MongoDB Atlas)
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd backendNest
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env
   ```

4. **Editar el archivo .env** con tus configuraciones:
   ```env
   # Configuración del Servidor
   PORT=5001
   NODE_ENV=development

   # Base de Datos MongoDB
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tizanafresh

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=24h

   # Email Configuration (usando Gmail)
   MAIL_MAILER=smtp
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=tu-email@gmail.com
   MAIL_PASSWORD=tu-app-password
   MAIL_ENCRYPTION=tls
   MAIL_FROM_ADDRESS=tu-email@gmail.com
   MAIL_FROM_NAME="Tizanas Fresh"

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

5. **Ejecutar el servidor**
   ```bash
   # Desarrollo
   npm run start:dev

   # Producción
   npm run build
   npm run start:prod
   ```

## 📧 Configuración de Email

### Para Gmail:
1. Activar la verificación en dos pasos
2. Generar una contraseña de aplicación
3. Usar esa contraseña en `MAIL_PASSWORD`

### Para desarrollo (Ethereal Email):
```env
ETHEREAL_USER=tu-email@ethereal.email
ETHEREAL_PASS=tu-password
```

## 🗄️ Estructura de la Base de Datos

### Colecciones principales:
- **users**: Usuarios del sistema
- **products**: Productos y tizanas
- **categories**: Categorías de productos
- **orders**: Pedidos de usuarios
- **coupons**: Cupones de descuento
- **loyalty_history**: Historial de puntos
- **notifications**: Notificaciones push
- **password_reset**: Tokens de recuperación

## 🔌 Endpoints API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login de usuario
- `POST /api/auth/forgot-password` - Solicitar recuperación
- `POST /api/auth/reset-password` - Resetear contraseña
- `GET /api/auth/verify-reset-token/:token` - Verificar token

### Usuarios
- `GET /api/auth/profile` - Obtener perfil (requiere JWT)
- `PUT /api/auth/profile` - Actualizar perfil
- `POST /api/auth/change-password` - Cambiar contraseña

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto
- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/:id` - Actualizar producto (admin)
- `DELETE /api/products/:id` - Eliminar producto (admin)

### Categorías
- `GET /api/categories` - Listar categorías
- `GET /api/categories/:id` - Obtener categoría

### Seeding (solo desarrollo)
- `POST /api/seed/products` - Poblar productos
- `POST /api/seed/categories` - Poblar categorías
- `POST /api/seed/users` - Poblar usuarios

## 🔐 Autenticación

El sistema usa JWT (JSON Web Tokens) para autenticación:

1. **Registro/Login**: Obtener token JWT
2. **Requests autenticados**: Incluir header `Authorization: Bearer <token>`
3. **Recuperación de contraseña**: Sistema de emails con tokens seguros

## 📊 Casos de Uso

La documentación completa con casos de uso está disponible en:
- `documentation/auth-api.html` - API de autenticación
- `documentation/products-api.html` - API de productos
- `documentation/seed-api.html` - API de seeding

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:cov
```

## 📝 Scripts Disponibles

```bash
npm run start:dev      # Desarrollo con hot reload
npm run build          # Compilar para producción
npm run start:prod     # Ejecutar en producción
npm run lint           # Linting
npm run lint:fix       # Linting con auto-fix
npm run test           # Tests unitarios
npm run test:e2e       # Tests end-to-end
```

## 🔧 Configuración Avanzada

### Variables de Entorno Adicionales

```env
# Seguridad
BCRYPT_ROUNDS=12
PASSWORD_RESET_EXPIRES_IN=3600000

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# Validación
VALIDATION_PIPE_TRANSFORM=true
VALIDATION_PIPE_WHITELIST=true
VALIDATION_PIPE_FORBID_NON_WHITELISTED=true

# Paginación
DEFAULT_PAGE_SIZE=10
MAX_PAGE_SIZE=100
```

## 🚀 Despliegue

### Variables de Producción
```env
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=super-secret-production-key
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=production-email@gmail.com
MAIL_PASSWORD=production-app-password
```

## 📈 Estado del Proyecto

- ✅ **Fase 1**: Configuración inicial (100%)
- ✅ **Fase 2**: Autenticación y usuarios (100%)
- ✅ **Fase 3**: Módulo de productos (100%)
- 🔄 **Fase 4**: Módulo de pedidos (0%)
- ⏳ **Fase 5**: Sistema de fidelización (0%)
- ⏳ **Fase 6**: Notificaciones push (0%)
- ⏳ **Fase 7**: Optimizaciones y testing (0%)
- ⏳ **Fase 8**: Documentación final (0%)

**Progreso General: 44% completado**

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Email: soporte@tizanafresh.com
- Documentación: `documentation/` folder
- Issues: GitHub Issues

---

**🍹 Tizanas Fresh** - Bebidas saludables para una vida mejor
