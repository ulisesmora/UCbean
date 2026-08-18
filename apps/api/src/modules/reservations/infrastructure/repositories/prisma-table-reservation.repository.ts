import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ITableReservationRepository } from '../../domain/repositories/table-reservation.repository.interface';
import {
  TableReservation,
  ReservationStatus,
} from '../../domain/entities/table-reservation.entity';

@Injectable()
export class PrismaTableReservationRepository implements ITableReservationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toEntity(r: {
    id: string;
    userId: string;
    tableId: string;
    partySize: number;
    scheduledAt: Date;
    status: string;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): TableReservation {
    return new TableReservation(
      r.id,
      r.userId,
      r.tableId,
      r.partySize,
      r.scheduledAt,
      r.status as ReservationStatus,
      r.notes,
      r.createdAt,
      r.updatedAt,
    );
  }

  async findByUser(userId: string): Promise<TableReservation[]> {
    const rows = await this.prisma.tableReservation.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'desc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async findById(id: string): Promise<TableReservation | null> {
    const r = await this.prisma.tableReservation.findUnique({ where: { id } });
    return r ? this.toEntity(r) : null;
  }

  async findByDateRange(from: Date, to: Date): Promise<TableReservation[]> {
    const rows = await this.prisma.tableReservation.findMany({
      where: { scheduledAt: { gte: from, lte: to }, status: { not: 'CANCELLED' } },
      orderBy: { scheduledAt: 'asc' },
    });
    return rows.map((r) => this.toEntity(r));
  }

  async create(data: {
    userId: string;
    tableId: string;
    partySize: number;
    scheduledAt: Date;
    notes?: string;
  }): Promise<TableReservation> {
    const r = await this.prisma.tableReservation.create({ data });
    return this.toEntity(r);
  }

  async updateStatus(id: string, status: ReservationStatus): Promise<TableReservation> {
    const r = await this.prisma.tableReservation.update({ where: { id }, data: { status } });
    return this.toEntity(r);
  }
}
