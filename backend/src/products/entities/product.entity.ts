import { EntitySchema, BeforeInsert, BeforeUpdate } from 'typeorm';
import { IBrand } from '../../brands/entities/brand.entity';
import { ICategories } from 'src/categories/entities/category.entity';
import { ITag } from 'src/tags/entities/tag.entity';
import { IProductSpecification } from './product-specification.entity';
import { IProductImage } from './product-image.entity';

export interface IProduct {
  product_id: number;
  sku: string;
  name: string;
  slug: string;
  brand_id: number;
  category_id: number;
  price: number;
  sale_price: number | null;
  quantity: number;
  description: string | null;
  is_active: boolean;
  primary_image?: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  brand?: IBrand;
  category?: ICategories;
  product_tag?: ITag[];
  specification?: IProductSpecification;
  images?: IProductImage[];
}
export const ProductSchema = new EntitySchema<IProduct>({
  name: 'Product',
  tableName: 'products',
  columns: {
    product_id: {
      type: 'int',
      primary: true,
      generated: 'increment',
    },
    sku: {
      type: 'varchar',
      unique: true,
    },
    name: {
      type: 'varchar',
    },
    slug: {
      type: 'varchar',
      length: 255,
      unique: true,
    },
    brand_id: {
      type: 'int',
    },
    category_id: {
      type: 'int',
    },
    price: {
      type: 'bigint',
    },
    sale_price: {
      type: 'bigint',
      nullable: true,
    },
    quantity: {
      type: 'int',
      default: 0,
    },
    description: {
      type: 'longtext',
      nullable: true,
    },
    is_active: {
      type: 'boolean',
      default: true,
    },
    created_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    updated_at: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
    },
    deleted_at: {
      type: 'timestamp',
      nullable: true,
      deleteDate: true,
    },
  },
  relations: {
    brand: {
      type: 'many-to-one',
      target: 'Brand',
      joinColumn: {
        name: 'brand_id',
        referencedColumnName: 'brand_id',
      },
      inverseSide: 'products',
    },

    category: {
      type: 'many-to-one',
      target: 'Categories',
      joinColumn: {
        name: 'category_id',
      },
      inverseSide: 'productCate',
    },
    product_tag: {
      type: 'many-to-many',
      target: 'Tag',
      cascade: true,
      joinTable: {
        name: 'product_tags', //ten bang trung gian
        joinColumn: { name: 'product_id' },
        inverseJoinColumn: { name: 'tag_id' },
      },
      inverseSide: 'products_tag',
    },
    specification: {
      type: 'one-to-one',
      target: 'ProductSpecification',
      inverseSide: 'product',
    },
    images: {
      type: 'one-to-many',
      target: 'ProductImage',
      inverseSide: 'product',
    },
  },
});
