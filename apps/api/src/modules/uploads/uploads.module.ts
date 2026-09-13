import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'node:path';
import { ImageService } from './application/image.service';
import { UploadsController } from './presentation/uploads.controller';

/** Dónde viven los archivos. Fuera de `src`, para que no los borre un build. */
export const uploadsDir = (config?: ConfigService) =>
  config?.get<string>('UPLOADS_DIR') ?? join(process.cwd(), 'uploads');

@Module({
  controllers: [UploadsController],
  providers: [
    {
      provide: ImageService,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new ImageService(uploadsDir(config)),
    },
  ],
  exports: [ImageService],
})
export class UploadsModule {}
