import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AddressesService } from '../addresses.service';

describe('AddressesService', () => {
  let prisma: any;
  let service: AddressesService;

  beforeEach(() => {
    prisma = {
      address: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        create: jest
          .fn()
          .mockImplementation(({ data }: any) => Promise.resolve({ id: 'a1', ...data })),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({ isDefault: false }),
      },
      order: { count: jest.fn().mockResolvedValue(0) },
    };
    service = new AddressesService(prisma);
  });

  const DATOS = {
    label: 'Casa',
    street: 'Wesbrook Mall 2075',
    city: 'Vancouver',
    postalCode: 'V6T 1Z4',
  };

  describe('assertOwned', () => {
    it('deja pasar la dirección de su dueño', async () => {
      prisma.address.findUnique.mockResolvedValue({ userId: 'u1' });
      await expect(service.assertOwned('a1', 'u1')).resolves.toBeUndefined();
    });

    it('rechaza la dirección de otra persona', async () => {
      // Sin esto, mandar el id de otro en un pedido devolvería dónde vive.
      prisma.address.findUnique.mockResolvedValue({ userId: 'otro' });
      await expect(service.assertOwned('a1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('rechaza una dirección que no existe', async () => {
      prisma.address.findUnique.mockResolvedValue(null);
      await expect(service.assertOwned('nada', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('marca la primera como principal sin que nadie lo pida', async () => {
      // Nadie quiere marcar una casilla para decir que su única casa es
      // su casa.
      prisma.address.count.mockResolvedValue(0);
      const out = await service.create('u1', DATOS);
      expect(out.isDefault).toBe(true);
    });

    it('no marca la segunda como principal por su cuenta', async () => {
      prisma.address.count.mockResolvedValue(1);
      const out = await service.create('u1', DATOS);
      expect(out.isDefault).toBe(false);
    });

    it('quita la marca a la anterior cuando se pide otra principal', async () => {
      prisma.address.count.mockResolvedValue(2);
      await service.create('u1', { ...DATOS, isDefault: true });
      expect(prisma.address.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isDefault: false } }),
      );
    });
  });

  describe('remove', () => {
    beforeEach(() => prisma.address.findUnique.mockResolvedValue({ userId: 'u1' }));

    it('no borra una dirección con pedidos', async () => {
      // Borrarla rompería el historial de esos pedidos.
      prisma.order.count.mockResolvedValue(3);
      await expect(service.remove('a1', 'u1')).rejects.toThrow(ForbiddenException);
      expect(prisma.address.delete).not.toHaveBeenCalled();
    });

    it('borra una sin pedidos', async () => {
      await expect(service.remove('a1', 'u1')).resolves.toEqual({ ok: true });
    });

    it('asciende otra cuando se borra la principal', async () => {
      // Si no, el siguiente pedido se queda sin ninguna marcada.
      prisma.address.delete.mockResolvedValue({ isDefault: true });
      prisma.address.findFirst.mockResolvedValue({ id: 'a2' });

      await service.remove('a1', 'u1');

      expect(prisma.address.update).toHaveBeenCalledWith({
        where: { id: 'a2' },
        data: { isDefault: true },
      });
    });

    it('no asciende nada si era la única', async () => {
      prisma.address.delete.mockResolvedValue({ isDefault: true });
      prisma.address.findFirst.mockResolvedValue(null);

      await service.remove('a1', 'u1');
      expect(prisma.address.update).not.toHaveBeenCalled();
    });

    it('no borra la dirección de otra persona', async () => {
      prisma.address.findUnique.mockResolvedValue({ userId: 'otro' });
      await expect(service.remove('a1', 'u1')).rejects.toThrow(ForbiddenException);
    });
  });
});
