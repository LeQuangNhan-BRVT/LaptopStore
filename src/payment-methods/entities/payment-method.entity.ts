import { EntitySchema } from "typeorm";
import { IOrder } from "src/orders/entities/order.entity";

export interface IPaymentMethod {
    payment_method_id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    orders?: IOrder[];
}

export const PaymentMethodSchema = new EntitySchema<IPaymentMethod>({
    name: 'PaymentMethod',
    tableName: 'payment_methods',
    columns: {
        payment_method_id: {
            type: 'int',
            primary: true,
            generated: 'increment'
        },
        name: {
            type: 'varchar',
            length: 255
        },
        code: {
            type: 'varchar',
            length: 50,
            unique: true
        },
        description: {
            type: 'text',
            nullable: true
        },
        is_active: {
            type: 'boolean',
            default: true
        }
    },
    relations: {
        orders: {
            type: 'one-to-many',
            target: 'Order',
            inverseSide: 'payment_method'
        }
    }
});

