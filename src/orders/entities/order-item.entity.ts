import { EntitySchema } from "typeorm";
import { IOrder } from "./order.entity";
import { IProduct } from "src/products/entities/product.entity";

export interface IOrderItem {
    order_item_id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    price_at_purchase: number;
    order?: IOrder;
    product?: IProduct;
}

export const OrderItemSchema = new EntitySchema<IOrderItem>({
    name: 'OrderItem',
    tableName: 'order_items',
    columns: {
        order_item_id: {
            type: 'int',
            primary: true,
            generated: 'increment'
        },
        order_id: {
            type: 'int'
        },
        product_id: {
            type: 'int'
        },
        quantity: {
            type: 'int'
        },
        price_at_purchase: {
            type: 'bigint'
        }
    },
    relations: {
        order: {
            type: 'many-to-one',
            target: 'Order',
            joinColumn: {
                name: 'order_id',
                referencedColumnName: 'order_id'
            },
            inverseSide: 'order_items'
        },
        product: {
            type: 'many-to-one',
            target: 'Product',
            joinColumn: {
                name: 'product_id',
                referencedColumnName: 'product_id'
            }
        }
    }
});

