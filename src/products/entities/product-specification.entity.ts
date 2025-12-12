import { EntitySchema } from "typeorm";
import { IProduct } from "./product.entity";

export interface IProductSpecification {
    spec_id: number;
    product_id: number;
    cpu: string | null;
    ram: string | null;
    storage: string | null;
    gpu: string | null;
    screen: string | null;
    os: string | null;
    pin: string | null;
    weight: number | null;
    product?: IProduct;
}

export const ProductSpecificationSchema = new EntitySchema<IProductSpecification>({
    name: 'ProductSpecification',
    tableName: 'product_specifications',
    columns: {
        spec_id: {
            type: 'int',
            primary: true,
            generated: 'increment'
        },
        product_id: {
            type: 'int',
            unique: true
        },
        cpu: {
            type: 'varchar',
            nullable: true
        },
        ram: {
            type: 'varchar',
            nullable: true
        },
        storage: {
            type: 'varchar',
            nullable: true
        },
        gpu: {
            type: 'varchar',
            nullable: true
        },
        screen: {
            type: 'varchar',
            nullable: true
        },
        os: {
            type: 'varchar',
            nullable: true
        },
        pin: {
            type: 'varchar',
            nullable: true
        },
        weight: {
            type: 'decimal',
            precision: 4,
            scale: 2,
            nullable: true
        }
    },
    relations: {
        product: {
            type: 'one-to-one',
            target: 'Product',
            joinColumn: {
                name: 'product_id',
                referencedColumnName: 'product_id'
            },
            inverseSide: 'specification'
        }
    }
});

