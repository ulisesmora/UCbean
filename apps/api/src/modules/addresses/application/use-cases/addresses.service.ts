import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export interface AddressInput {
  label: string;
  street: string;
  city: string;
  postalCode: string;
  isDefault?: boolean;
}

/**
 * Las direcciones de entrega.
 *
 * La tabla existía desde el primer día y el pedido ya aceptaba un
 * `deliveryAddressId`, pero no había forma de crear una. Un pedido a
 * domicilio no se podía completar.
 */
@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  listFor(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Confirma que una dirección es de quien dice.
   *
   * Lo llama el pedido antes de escribir nada. Sin esta comprobación
   * cualquiera podría mandar el id de la dirección de otra persona y ver
   * dónde vive en el pedido que le devuelve la API.
   */
  async assertOwned(addressId: string, userId: string): Promise<void> {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
      select: { userId: true },
    });
    if (!address) throw new NotFoundException('Address not found');
    if (address.userId !== userId)
      throw new ForbiddenException('This address belongs to another account');
  }

  async create(userId: string, input: AddressInput) {
    const count = await this.prisma.address.count({ where: { userId } });
    // La primera dirección es la de siempre. Nadie quiere marcar una
    // casilla para decir que su única casa es su casa.
    const isDefault = input.isDefault ?? count === 0;

    if (isDefault) await this.clearDefault(userId);

    return this.prisma.address.create({
      data: { ...input, userId, isDefault },
    });
  }

  async update(id: string, userId: string, input: Partial<AddressInput>) {
    await this.assertOwned(id, userId);
    if (input.isDefault) await this.clearDefault(userId);

    return this.prisma.address.update({ where: { id }, data: input });
  }

  /**
   * Borra una dirección.
   *
   * Los pedidos viejos apuntan aquí, así que el borrado real rompería el
   * historial. Prisma lo impediría de todas formas, pero el mensaje sería
   * un error de clave foránea en vez de algo que se entienda.
   */
  async remove(id: string, userId: string) {
    await this.assertOwned(id, userId);

    const usada = await this.prisma.order.count({ where: { deliveryAddressId: id } });
    if (usada > 0) {
      throw new ForbiddenException(
        'This address has orders. Deleting it would break your order history.',
      );
    }

    const borrada = await this.prisma.address.delete({ where: { id } });

    // Si se fue la principal, asciende la más reciente de las que quedan,
    // para que el siguiente pedido no se quede sin ninguna marcada.
    if (borrada.isDefault) {
      const siguiente = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (siguiente) {
        await this.prisma.address.update({
          where: { id: siguiente.id },
          data: { isDefault: true },
        });
      }
    }

    return { ok: true };
  }

  private clearDefault(userId: string) {
    return this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }
}
