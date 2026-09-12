import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { MAILER } from './domain/ports/mailer.port';
import { ResendMailer } from './infrastructure/mailers/resend.mailer';
import { LogMailer } from './infrastructure/mailers/log.mailer';
import { SendNotificationUseCase } from './application/use-cases/send-notification.use-case';
import { NotificationListener } from './application/listeners/notification.listener';
import { NotificationsController } from './presentation/controllers/notifications.controller';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    {
      provide: MAILER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const key = config.get<string>('RESEND_API_KEY');
        if (key) return new ResendMailer(config);

        // Sin llave en producción los correos desaparecerían en silencio,
        // y eso no se descubre hasta que un cliente reclama que nunca le
        // llegó su código. Mejor que el arranque falle aquí y ahora.
        if (config.get<string>('NODE_ENV') === 'production') {
          throw new Error('Falta RESEND_API_KEY. En producción los correos tienen que salir.');
        }
        new Logger('Correo').warn('Sin RESEND_API_KEY: los correos van al log, no al buzón.');
        return new LogMailer();
      },
    },
    SendNotificationUseCase,
    NotificationListener,
  ],
  // MAILER sale fuera porque las campañas mandan correo sin pasar por
  // el aviso individual: una campaña no deja un registro por persona en
  // la bandeja por cada intento, lleva su propia tabla de entregas.
  exports: [SendNotificationUseCase, MAILER],
})
export class NotificationsModule {}
