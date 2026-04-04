import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:8548';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });
  app.setGlobalPrefix('api/v1.0');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
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
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 8547);
}
bootstrap();
