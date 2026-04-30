import { EntitySchema } from "typeorm";
import { IProduct } from "./product.entity";

export interface IProductImage {
    image_id: number;
    product_id: number;
    image_url: string;
    is_primary: boolean;
    product?: IProduct;
}

export const ProductImageSchema = new EntitySchema<IProductImage>({
    name: 'ProductImage',
    tableName: 'product_images',
    columns: {
        image_id: {
            type: 'int',
            primary: true,
            generated: 'increment'
        },
        product_id: {
            type: 'int'
        },
        image_url: {
            type: 'varchar'
        },
        is_primary: {
            type: 'boolean',
            default: false
        }
    },
    relations: {
        product: {
            type: 'many-to-one',
            target: 'Product',
            joinColumn: {
                name: 'product_id',
                referencedColumnName: 'product_id'
            },
            inverseSide: 'images'
        }
    }
});

