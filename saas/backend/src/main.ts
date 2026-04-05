import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { allowedTokensFromEntries, loadApiKeys } from './config/load-api-keys';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const keyEntries = loadApiKeys();
  const allowedTokens = allowedTokensFromEntries(keyEntries);
  if (allowedTokens.size === 0) {
    console.warn(
      '[bootstrap] No deployment API keys in env (API_KEYS_JSON / API_KEYS_FILE). JWT and per-assistant API tokens still work.',
    );
  }

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:8548';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-API-Key',
      'X-Requested-With',
    ],
  });
  app.setGlobalPrefix('api/v1.0');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(
    '/api/v1.0',
    (req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'OPTIONS') {
        next();
        return;
      }
      if (
        req.path.startsWith('/auth/google') ||
        req.path.startsWith('/auth/verify-email')
      ) {
        next();
        return;
      }
      const raw = req.headers['x-api-key'];
      const key = Array.isArray(raw) ? raw[0] : raw;
      const auth = req.headers.authorization;
      const bearer =
        typeof auth === 'string' && auth.startsWith('Bearer ') ? auth : undefined;
      if (req.method === 'GET' && (req.path === '/' || req.path === '')) {
        next();
        return;
      }
      if (key && allowedTokens.has(key)) {
        next();
        return;
      }
      if (key) {
        next();
        return;
      }
      if (bearer) {
        next();
        return;
      }
      res.status(403).json({ message: 'Invalid or missing API key or Authorization' });
    },
  );

  const swaggerUser = process.env.SWAGGER_USER ?? 'moez';
  const swaggerPassword = process.env.SWAGGER_PASSWORD ?? 'moez';
  const swaggerAuth = basicAuth({
    users: { [swaggerUser]: swaggerPassword },
    challenge: true,
    realm: 'Swagger UI',
  });
  app.use('/docs', swaggerAuth);
  app.use('/docs-json', swaggerAuth);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Synapse Control Plane API')
    .setDescription('REST API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addApiKey(
      { type: 'apiKey', name: 'X-API-Key', in: 'header', description: 'Client API key' },
      'api-key',
    )
    // Sans ceci, le schéma apparaît dans « Authorize » mais n’est pas appliqué aux requêtes « Try it out ».
    .addSecurityRequirements('api-key')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 8547);
}
bootstrap();
