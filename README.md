# 🍹 Tizanas Fresh - Backend API

Backend completo para la aplicación Tizanas Fresh desarrollado con NestJS y MongoDB.

## 📋 Descripción

Tizanas Fresh es una aplicación móvil para pedidos de tizanas y bebidas saludables. Este backend proporciona todas las APIs necesarias para el funcionamiento de la aplicación, incluyendo autenticación, gestión de productos, pedidos, fidelización y notificaciones.

## 🚀 Características Implementadas

### ✅ Completado
- **Configuración del Proyecto**: NestJS con TypeScript y MongoDB
- **Autenticación JWT**: Sistema completo de autenticación con bcrypt
- **Esquemas de Base de Datos**: Todos los modelos de Mongoose implementados
- **Sistema de Seeding**: Población automática de datos de prueba
- **Documentación Completa**: APIs documentadas en HTML

### 🚧 En Desarrollo
- Validación de datos con class-validator
- Middleware de seguridad
- Sistema de logging centralizado

### 📋 Planificado
- Módulo de productos y categorías
- Sistema de pedidos completo
- Gestión de cupones
- Sistema de fidelización
- Notificaciones push

## 🛠️ Stack Tecnológico

- **Framework**: NestJS (Node.js)
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT + Passport + bcrypt
- **Validación**: class-validator + class-transformer
- **Documentación**: HTML personalizado

## 📦 Instalación

### Prerrequisitos
- Node.js (v18 o superior)
- MongoDB (local o Atlas)
- npm o yarn

### Pasos de Instalación

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

Editar el archivo `.env` con tus configuraciones:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/tizanafresh

# JWT
JWT_SECRET=tu-secreto-super-seguro
JWT_EXPIRES_IN=24h

# Servidor
PORT=3000
NODE_ENV=development
```

4. **Poblar la base de datos con datos de prueba**
```bash
# Iniciar el servidor
npm run start:dev

# En otra terminal, poblar la base de datos
curl -X POST http://localhost:3000/seed
```

## 🚀 Uso

### Iniciar el servidor

```bash
# Desarrollo
npm run start:dev

# Producción
npm run start:prod
```

### Probar la API

#### 1. Autenticación
```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tizanafresh.com",
    "password": "password123"
  }'

# Verificar token
curl -X GET http://localhost:3000/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 2. Seeding
```bash
# Poblar base de datos
curl -X POST http://localhost:3000/seed

# Verificar estado
curl -X GET http://localhost:3000/seed/status
```

## 📚 Documentación

### Documentación de APIs
- [Índice de APIs](documentation/api/index.html)
- [API de Autenticación](documentation/api/auth-api.html)
- [API de Seeding](documentation/api/seed-api.html)
- [API de Productos](documentation/api/products-api.html) (Planificada)
- [API de Pedidos](documentation/api/orders-api.html) (Planificada)

### Documentación Técnica
- [Documentación Técnica del Backend](documentation/backend_technical_documentation.html)
- [Esquema de Base de Datos](documentation/database_schema_documentation.html)
- [Requerimientos del Frontend](documentation/frontend_requirement_for_backend.html)
- [Documento de Tareas](documentation/task.html)

## 🗄️ Estructura de la Base de Datos

### Colecciones Implementadas
- **Users**: Usuarios con niveles de fidelización
- **Categories**: Categorías de productos
- **Products**: Productos con información nutricional
- **Orders**: Pedidos con estados y tracking
- **Coupons**: Cupones de descuento
- **Notifications**: Notificaciones push
- **LoyaltyHistory**: Historial de puntos de fidelización
- **DeviceTokens**: Tokens para notificaciones

### Datos de Prueba
El sistema de seeding crea automáticamente:
- 5 usuarios con diferentes niveles
- 5 categorías de productos
- 5 productos con información nutricional
- 3 cupones de diferentes tipos
- 2 pedidos de ejemplo
- 4 notificaciones
- 4 registros de fidelización
- 3 tokens de dispositivos

## 🔐 Autenticación

### Usuarios de Prueba
| Email | Contraseña | Nivel | Puntos |
|-------|------------|-------|--------|
| admin@tizanafresh.com | password123 | PLATINUM | 1000 |
| maria@example.com | password123 | GOLD | 750 |
| carlos@example.com | password123 | SILVER | 500 |
| ana@example.com | password123 | BRONZE | 250 |
| luis@example.com | password123 | BRONZE | 100 |

### Endpoints de Autenticación
- `POST /auth/login` - Login de usuario
- `POST /auth/login-local` - Login con guard local
- `GET /auth/profile` - Obtener perfil (requiere JWT)
- `GET /auth/verify` - Verificar token (requiere JWT)

## 📊 Estado del Proyecto

### Progreso General: 22%
- **Fase 1: Configuración Inicial** - 100% ✅
- **Fase 2: Autenticación y Usuarios** - 33% 🚧
- **Fase 3: Módulo de Productos** - 0% 📋
- **Fase 4: Módulo de Pedidos** - 0% 📋
- **Fase 5: Sistema de Fidelización** - 0% 📋
- **Fase 6: Sistema de Cupones** - 0% 📋
- **Fase 7: Sistema de Notificaciones** - 0% 📋
- **Fase 8: Testing y Documentación** - 0% 📋

### Tareas Completadas: 12/54
- ✅ Configuración inicial del proyecto
- ✅ Conexión a MongoDB
- ✅ Variables de entorno
- ✅ Logging y manejo de errores
- ✅ Configuración centralizada
- ✅ Esquemas de base de datos
- ✅ Sistema de seeding
- ✅ Autenticación JWT básica
- ✅ Documentación de APIs

## 🧪 Testing

### Pruebas Manuales
```bash
# 1. Probar autenticación
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@tizanafresh.com", "password": "password123"}'

# 2. Usar el token para acceder a rutas protegidas
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Poblar base de datos
curl -X POST http://localhost:3000/seed
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev

# Producción
npm run start:prod

# Build
npm run build

# Testing
npm run test
npm run test:e2e

# Linting
npm run lint
```

## 📁 Estructura del Proyecto

```
src/
├── auth/                 # Módulo de autenticación
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── guards/          # Guards de autenticación
│   ├── strategies/      # Estrategias de Passport
│   └── decorators/      # Decoradores personalizados
├── schemas/             # Esquemas de Mongoose
│   ├── user.schema.ts
│   ├── product.schema.ts
│   ├── order.schema.ts
│   └── ...
├── seed/                # Sistema de seeding
│   ├── seed.service.ts
│   ├── seed.controller.ts
│   └── seed.module.ts
├── config/              # Configuración
│   ├── app.config.ts
│   └── database.config.ts
├── app.controller.ts
├── app.service.ts
├── app.module.ts
└── main.ts
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Contacto

- **Proyecto**: Tizanas Fresh Backend
- **Versión**: 1.0.0
- **Estado**: En desarrollo

---

**Nota**: Este proyecto está en desarrollo activo. Las APIs planificadas se implementarán según el cronograma establecido en la documentación de tareas.
