import { BadRequestException, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ImageService, MAX_BYTES } from '../application/image.service';

/**
 * Subida de fotos de producto.
 *
 * Solo el personal sube archivos. Una ruta de subida abierta es una
 * invitación a que alguien llene el disco, y esto escribe en el mismo
 * servidor que atiende la API.
 */
@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'STAFF')
export class UploadsController {
  constructor(private readonly images: ImageService) {}

  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir una foto de producto',
    description:
      'Returns the URL optimised as WebP, plus a thumbnail. The name comes from the ' +
      'content, so it can be cached forever and uploading the same photo twice ' +
      'no duplica nada.',
  })
  async uploadImage(@Req() req: any) {
    if (!req.isMultipart?.()) {
      throw new BadRequestException('Manda el archivo como multipart/form-data');
    }

    const file = await req.file({ limits: { fileSize: MAX_BYTES } });
    if (!file) throw new BadRequestException('No file was received');

    const buffer = await file.toBuffer();

    // Fastify corta la lectura al llegar al límite en vez de fallar, así
    // que hay que preguntarle si truncó. Sin esto se guardaría media foto.
    if (file.file.truncated) {
      throw new BadRequestException('La imagen pasa de 5 MB');
    }

    return this.images.save(buffer, file.mimetype);
  }
}
