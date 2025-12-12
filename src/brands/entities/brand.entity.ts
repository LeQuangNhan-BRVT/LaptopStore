
import { EntitySchema } from 'typeorm';
import { IProduct } from '../../products/entities/product.entity';

export interface IBrand {
  brand_id: number;
  name: string;
  logo_url: string | null;
  products: IProduct[];
  deleted_at: Date | null;
}

export const BrandSchema = new EntitySchema<IBrand>({
  name: 'Brand',
  tableName: 'brands',
  columns: {
    brand_id: { type: 'int', primary: true, generated: 'increment' },
    name: { type: 'varchar', unique: true },
    logo_url: { type: 'varchar', nullable: true },deleted_at: {
      type: 'timestamp',
      nullable: true,
      name: 'deleted_at',
      deleteDate: true
  }
  },
  relations: {
    products: {
      type: 'one-to-many',
      target: 'Product',
      inverseSide: 'brand',
    },
  },
});