import { EntitySchema } from 'typeorm';
import { IProduct } from 'src/products/entities/product.entity';


export interface ICategories {
  category_id: number;
  name: string;
  description: string | null;
  productCate?: IProduct[];
  deleted_at: Date | null;
}
export const CategoriesSchema = new EntitySchema<ICategories>({
  name: 'Categories',
  tableName: 'categories',
  columns: {
    category_id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    name: { type: 'varchar' },
    description: { type: 'text', nullable: true },
    deleted_at: {
      type: 'timestamp',
      nullable: true,
      name: 'deleted_at',
      deleteDate: true,
    },
  },
  relations: {
    productCate: {
      type: 'one-to-many',
      target: 'Product',
      inverseSide: 'category',
    },
  },
});
