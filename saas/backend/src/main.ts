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
    throw new Error(
      'No API keys configured. Set API_KEYS_JSON or API_KEYS_FILE (see .env.example and config/api-keys.example.json).',
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
      const raw = req.headers['x-api-key'];
      const key = Array.isArray(raw) ? raw[0] : raw;
      if (!key || !allowedTokens.has(key)) {
        res.status(403).json({ message: 'Invalid or missing API key' });
        return;
      }
      next();
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
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 8547);
}
bootstrap();
