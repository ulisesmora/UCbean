import { OrderEntity, OrderItemEntity } from '../order.entity';

const makeOrder = (status: OrderEntity['status']) =>
  new OrderEntity(
    'ord-1',
    'user-1',
    'PICKUP',
    status,
    10.0,
    [new OrderItemEntity('oi-1', 'p-1', 2, 5.0)],
    null,
    null,
    new Date(),
    new Date(),
  );

describe('OrderEntity', () => {
  describe('canTransitionTo', () => {
    it('PENDING can go to CONFIRMED', () => {
      expect(makeOrder('PENDING').canTransitionTo('CONFIRMED')).toBe(true);
    });

    it('PENDING can be CANCELLED', () => {
      expect(makeOrder('PENDING').canTransitionTo('CANCELLED')).toBe(true);
    });

    it('PENDING cannot skip to COMPLETED', () => {
      expect(makeOrder('PENDING').canTransitionTo('COMPLETED')).toBe(false);
    });

    it('COMPLETED cannot transition anywhere', () => {
      const order = makeOrder('COMPLETED');
      expect(order.canTransitionTo('PENDING')).toBe(false);
      expect(order.canTransitionTo('CANCELLED')).toBe(false);
    });
  });

  describe('OrderItemEntity', () => {
    it('calculates subtotal correctly', () => {
      const item = new OrderItemEntity('i-1', 'p-1', 3, 4.5);
      expect(item.subtotal).toBe(13.5);
    });
  });
});
