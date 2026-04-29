"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('GymSync API')
        .setDescription('API REST del backend de GymSync — Gestión de gimnasios, usuarios, rutinas, entrenamientos y métricas.')
        .setVersion('1.0.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Ingresa tu JWT token',
        in: 'header',
    }, 'access-token')
        .addTag('Auth', 'Autenticación y registro')
        .addTag('Users', 'Gestión de usuarios y perfiles')
        .addTag('Roles & Permissions', 'Sistema flexible de roles y permisos')
        .addTag('Gyms', 'Gimnasios, ubicaciones y horarios')
        .addTag('Activities', 'Actividades, horarios y asistencia')
        .addTag('Exercises', 'Catálogo de ejercicios')
        .addTag('Routines', 'Rutinas de entrenamiento')
        .addTag('Training', 'Perfil, sesiones, series y restricciones')
        .addTag('Subscriptions', 'Planes, suscripciones y pagos')
        .addTag('Reservations', 'Reservas de actividades')
        .addTag('Waitlist', 'Lista de espera FIFO')
        .addTag('Check-ins', 'Acceso y check-in/check-out')
        .addTag('Metrics', 'Métricas físicas históricas')
        .addTag('Notifications', 'Notificaciones y preferencias')
        .addTag('System', 'Configuración del sistema')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            defaultModelsExpandDepth: 3,
            defaultModelExpandDepth: 3,
            defaultModelRendering: 'example',
            displayRequestDuration: true,
            docExpansion: 'list',
            filter: true,
        },
    });
    const port = configService.get('PORT') || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║          🏋️  GymSync API Server Running              ║
  ║──────────────────────────────────────────────────────║
  ║  URL:      http://localhost:${port}/api              ║
  ║  Swagger:  http://localhost:${port}/api/docs         ║
  ║  Env:      ${configService.get('NODE_ENV') || 'development'}                       ║
  ╚══════════════════════════════════════════════════════╝
  `);
}
bootstrap();
//# sourceMappingURL=main.js.map