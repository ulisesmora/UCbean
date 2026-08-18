import { BadRequestException } from '@nestjs/common';
import { CreateTableReservationUseCase } from '../create-table-reservation.use-case';
import { ITableReservationRepository } from '../../../domain/repositories/table-reservation.repository.interface';
import {
  ITableRepository,
  TableRecord,
} from '../../../domain/repositories/table.repository.interface';
import { TableReservation } from '../../../domain/entities/table-reservation.entity';

const makeReservation = (): TableReservation =>
  new TableReservation(
    'res-1',
    'user-1',
    'tbl-1',
    2,
    new Date('2026-09-01T10:00:00'),
    'PENDING',
    null,
    new Date(),
    new Date(),
  );

const table: TableRecord = { id: 'tbl-1', number: 1, capacity: 4, zone: 'indoor', isActive: true };

describe('CreateTableReservationUseCase', () => {
  let useCase: CreateTableReservationUseCase;
  let reservationRepo: jest.Mocked<ITableReservationRepository>;
  let tableRepo: jest.Mocked<ITableRepository>;

  beforeEach(() => {
    reservationRepo = {
      findByUser: jest.fn(),
      findById: jest.fn(),
      findByDateRange: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      updateStatus: jest.fn(),
    };
    tableRepo = {
      findAvailable: jest.fn().mockResolvedValue(table),
    };
    useCase = new CreateTableReservationUseCase(reservationRepo, tableRepo);
  });

  it('creates reservation when table is available', async () => {
    reservationRepo.create.mockResolvedValue(makeReservation());

    const result = await useCase.execute({
      userId: 'user-1',
      partySize: 2,
      scheduledAt: new Date('2026-09-01T10:00:00'),
    });

    expect(result.tableId).toBe('tbl-1');
    expect(reservationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', partySize: 2, tableId: 'tbl-1' }),
    );
  });

  it('excludes already-booked tables when searching', async () => {
    const booked = makeReservation();
    reservationRepo.findByDateRange.mockResolvedValue([booked]);
    reservationRepo.create.mockResolvedValue(makeReservation());
    tableRepo.findAvailable.mockResolvedValue(table);

    await useCase.execute({
      userId: 'user-1',
      partySize: 2,
      scheduledAt: new Date('2026-09-01T10:00:00'),
    });

    expect(tableRepo.findAvailable).toHaveBeenCalledWith(2, ['tbl-1']);
  });

  it('throws BadRequestException when no table available', async () => {
    tableRepo.findAvailable.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', partySize: 20, scheduledAt: new Date() }),
    ).rejects.toThrow(BadRequestException);
    expect(reservationRepo.create).not.toHaveBeenCalled();
  });
});
