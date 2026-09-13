import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { ImageService } from './application/image.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadsController } from './presentation/uploads.controller';

/** Dónde viven los archivos. Fuera de `src`, para que no los borre un build. */
export const uploadsDir = (config?: ConfigService) =>
  config?.get<string>('UPLOADS_DIR') ?? join(process.cwd(), 'uploads');

/** Every folder a photo may be in: the configured one first, then the app's own. */
export const uploadRoots = (config?: ConfigService) => [
  ...new Set([uploadsDir(config), join(process.cwd(), 'uploads')]),
];

@Module({
  controllers: [UploadsController],
  providers: [
    {
      provide: ImageService,
      inject: [ConfigService, PrismaService],
      useFactory: (config: ConfigService, prisma: PrismaService) =>
        new ImageService(uploadRoots(config), prisma),
    },
  ],
  exports: [ImageService],
})
export class UploadsModule {}
