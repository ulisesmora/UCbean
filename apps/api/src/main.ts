import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ImageService } from './modules/uploads/application/image.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env.NODE_ENV !== 'production' }),
    // El webhook de Stripe se firma sobre los bytes exactos que llegaron.
    // Parsear el JSON y volver a serializarlo cambia espacios y la firma
    // deja de cuadrar, así que Nest guarda el cuerpo original en
    // `req.rawBody`. Es una opción del framework: escribir un parser a
    // mano choca con el que Nest registra después.
    { rawBody: true },
  );

  await app.register(fastifyCookie as any, {
    secret: process.env.COOKIE_SECRET,
  });

  // Subida de fotos de producto. El límite se repite en el servicio con
  // un mensaje legible; aquí es la barrera dura que corta la lectura.
  await app.register(fastifyMultipart as any, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  });

  /**
   * Las imágenes, servidas por el propio backend.
   *
   * El nombre de cada archivo sale de su contenido, así que una URL
   * siempre devuelve los mismos bytes. Por eso se puede marcar como
   * inmutable un año: el navegador no vuelve a pedirla nunca, y si la
   * foto cambia, cambia la URL. Es lo que hace un CDN, sin contratar uno.
   */
  // Photos come from disk when the file is there and from the database
  // otherwise, so an upload keeps working after a redeploy wipes the disk.
  // Names come from the content, so a URL always returns the same bytes and
  // can be cached for a year.
  const images = app.get(ImageService);
  app
    .getHttpAdapter()
    .getInstance()
    .get('/uploads/:dir/:file', async (req: any, reply: any) => {
      const { dir, file } = req.params as { dir: string; file: string };
      const image = await images.read(`${dir}/${file}`);
      if (!image) return reply.code(404).send({ message: 'Photo not found' });
      return (
        reply
          .header('Content-Type', image.contentType)
          .header('Cache-Control', 'public, max-age=31536000, immutable')
          // The counter app and the website live on other domains.
          .header('Access-Control-Allow-Origin', '*')
          .header('Cross-Origin-Resource-Policy', 'cross-origin')
          .send(image.data)
      );
    });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Browsers send the Origin with no trailing slash, so "https://site.app/" in
  // the variable would never match and every request from it would be
  // blocked. Spaces and trailing slashes are trimmed, empty entries dropped.
  // Without the variable any origin is allowed, which is only for local dev.
  const origins = process.env.CORS_ORIGIN?.split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  app.enableCors({
    origin: origins?.length ? origins : true,
    credentials: true,
    // The Fastify CORS plugin allows only GET, HEAD and POST unless told
    // otherwise. The counter app changes order status and edits products
    // with PATCH and DELETE, so from another domain the browser blocked
    // exactly those calls while every read worked.
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // The browser may reuse a preflight for 10 minutes instead of asking
    // again before every request.
    maxAge: 600,
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
