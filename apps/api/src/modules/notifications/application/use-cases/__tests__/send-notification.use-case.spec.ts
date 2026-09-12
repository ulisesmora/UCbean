import { SendNotificationUseCase } from '../send-notification.use-case';
import type { IMailer } from '../../../domain/ports/mailer.port';

const MENSAJE = { title: 'Pedido confirmado', body: 'Ya lo estamos preparando.' };

describe('SendNotificationUseCase', () => {
  let prisma: any;
  let mailer: jest.Mocked<IMailer>;
  let useCase: SendNotificationUseCase;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      notification: { create: jest.fn().mockResolvedValue({}) },
    };
    mailer = { send: jest.fn().mockResolvedValue(undefined) };
    useCase = new SendNotificationUseCase(prisma, mailer);
  });

  const conUsuario = (marketingOptIn = false) =>
    prisma.user.findUnique.mockResolvedValue({ email: 'ana@ejemplo.com', marketingOptIn });

  it('manda por las dos vias: correo y bandeja', async () => {
    conUsuario();
    await useCase.execute({ userId: 'u1', type: 'ORDER', message: MENSAJE });

    expect(mailer.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'ana@ejemplo.com', subject: MENSAJE.title }),
    );
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it('no manda publicidad a quien no la acepto', async () => {
    conUsuario(false);
    await useCase.execute({ userId: 'u1', type: 'MARKETING', message: MENSAJE });

    expect(mailer.send).not.toHaveBeenCalled();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('manda publicidad a quien si la acepto', async () => {
    conUsuario(true);
    await useCase.execute({ userId: 'u1', type: 'MARKETING', message: MENSAJE });
    expect(mailer.send).toHaveBeenCalled();
  });

  it('manda los avisos del pedido aunque la publicidad este rechazada', async () => {
    // El aviso de un pedido es parte del servicio que la persona pidio,
    // no publicidad. Confundir las dos cosas deja a alguien sin saber
    // que su cafe esta listo.
    conUsuario(false);
    await useCase.execute({ userId: 'u1', type: 'ORDER', message: MENSAJE });
    expect(mailer.send).toHaveBeenCalled();
  });

  it('guarda el aviso aunque el correo falle', async () => {
    // Un proveedor caido no puede tumbar el pedido que provoco el aviso.
    conUsuario();
    mailer.send.mockRejectedValue(new Error('Resend respondio 503'));

    await expect(
      useCase.execute({ userId: 'u1', type: 'ORDER', message: MENSAJE }),
    ).resolves.toBeUndefined();
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it('respeta cuando solo se quiere dejar en la bandeja', async () => {
    // Los puntos de cada cafe no merecen un correo: seria el camino mas
    // corto a que marquen la cafeteria como spam.
    conUsuario();
    await useCase.execute({
      userId: 'u1',
      type: 'LOYALTY',
      message: MENSAJE,
      channels: { email: false, inApp: true },
    });

    expect(mailer.send).not.toHaveBeenCalled();
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it('no revienta si el usuario ya no existe', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      useCase.execute({ userId: 'fantasma', type: 'ORDER', message: MENSAJE }),
    ).resolves.toBeUndefined();
    expect(mailer.send).not.toHaveBeenCalled();
  });

  it('apunta a que pedido corresponde el aviso', async () => {
    conUsuario();
    await useCase.execute({
      userId: 'u1',
      type: 'ORDER',
      message: MENSAJE,
      orderId: 'ord-9',
    });
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ orderId: 'ord-9' }) }),
    );
  });
});
