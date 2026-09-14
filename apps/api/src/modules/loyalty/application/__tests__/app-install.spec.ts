import { LoyaltyService } from '../use-cases/loyalty.service';
import { APP_INSTALL_POINTS } from '../../domain/points-policy';

function setup(existing: object | null) {
  const prisma = {
    loyaltyCard: { findUnique: jest.fn().mockResolvedValue({ id: 'card', stamps: 0 }) },
    pointsEntry: {
      findFirst: jest.fn().mockResolvedValue(existing),
      create: jest.fn().mockResolvedValue({}),
      aggregate: jest.fn().mockResolvedValue({ _sum: { delta: APP_INSTALL_POINTS } }),
    },
  };
  return { prisma, service: new LoyaltyService(prisma as never) };
}

describe('LoyaltyService.rewardAppInstall', () => {
  it('awards the bonus the first time, tagged with where it came from', async () => {
    const { prisma, service } = setup(null);
    const r = await service.rewardAppInstall('u1', 'qr-counter');
    expect(r.awarded).toBe(APP_INSTALL_POINTS);
    expect(prisma.pointsEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ reason: 'APP_INSTALL', note: 'qr-counter' }),
    });
  });

  it('never awards it twice', async () => {
    const { prisma, service } = setup({ id: 'earlier' });
    const r = await service.rewardAppInstall('u1', 'qr-counter');
    expect(r.awarded).toBe(0);
    expect(prisma.pointsEntry.create).not.toHaveBeenCalled();
  });
});
