import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ── Global Prefix ──────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── CORS ───────────────────────────────────────────────────────
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // ── Global Pipes ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Global Filters & Interceptors ─────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ── Swagger Documentation ─────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('GymSync API')
    .setDescription(
      'API REST del backend de GymSync — Gestión de gimnasios, usuarios, rutinas, entrenamientos y métricas.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Ingresa tu JWT token',
        in: 'header',
      },
      'access-token',
    )
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

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
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

  // ── Start Server ──────────────────────────────────────────────
  const port = configService.get<number>('PORT') || 3000;
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
