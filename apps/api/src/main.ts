import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env.NODE_ENV !== 'production' }),
  );

  await app.register(fastifyCookie as any, {
    secret: process.env.COOKIE_SECRET,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });

  // OpenAPI spec
  const swaggerConfig = new DocumentBuilder()
    .setTitle('UCBean API')
    .setDescription('Around the Bean — Coffee Shop REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Raw JSON spec at /api-docs.json
  app.getHttpAdapter().get('/api-docs.json', (_req: any, reply: any) => {
    reply.header('Content-Type', 'application/json').send(document);
  });

  // Scalar UI at /api-docs
  app.getHttpAdapter().get('/api-docs', (_req: any, reply: any) => {
    reply.type('text/html').send(`<!doctype html>
<html>
  <head>
    <title>UCBean API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script id="api-reference" data-url="/api-docs.json"></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`);
  });

  await app.listen(+(process.env.PORT ?? 3000), '0.0.0.0');
  console.log(`API docs: http://localhost:${process.env.PORT ?? 3000}/api-docs`);
}

bootstrap();
