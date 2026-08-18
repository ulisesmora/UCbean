export const TABLE_REPOSITORY = Symbol('TABLE_REPOSITORY');

export interface TableRecord {
  id: string;
  number: number;
  capacity: number;
  zone: string | null;
  isActive: boolean;
}

export interface ITableRepository {
  findAvailable(minCapacity: number, excludeIds: string[]): Promise<TableRecord | null>;
}
