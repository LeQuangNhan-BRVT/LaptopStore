import { EntitySchema } from 'typeorm';
import { IProduct } from 'src/products/entities/product.entity';
export interface ITag {
  tag_id: number;
  name: string;
  slug: string;
  description: string;
  products_tag: IProduct[];
}
export const TagSchema = new EntitySchema<ITag>({
  name: 'Tag',
  tableName: 'tags',
  columns: {
    tag_id: { type: 'int', primary: true, generated: 'increment' },
    name: {type: 'varchar', unique: true},
    slug: {type: 'varchar', unique: true},
    description: {type: 'text'}
  },
  relations:{
    products_tag:{
        type: 'many-to-many',
        target: 'Product',
        inverseSide: 'product_tag'
    }
  }
});
