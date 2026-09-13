import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Lo que devuelve `PushManager.subscribe()` en el navegador. */
export class RegisterPushDto {
  @ApiProperty({ example: 'https://fcm.googleapis.com/fcm/send/abc123' })
  @IsUrl({ require_tld: false })
  @MaxLength(600)
  endpoint: string;

  @ApiProperty({ description: 'Browser public key, base64url' })
  @IsString()
  @MaxLength(200)
  p256dh: string;

  @ApiProperty({ description: 'Auth secret, base64url' })
  @IsString()
  @MaxLength(100)
  auth: string;

  @ApiPropertyOptional({ description: 'Which device registered it' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  userAgent?: string;
}
