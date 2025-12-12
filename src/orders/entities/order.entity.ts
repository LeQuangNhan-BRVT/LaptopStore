import { EntitySchema } from "typeorm";
import { IUser } from "src/users/entities/user.entity";
import { IPaymentMethod } from "src/payment-methods/entities/payment-method.entity";
import { IOrderItem } from "./order-item.entity";

export interface IOrder {
    order_id: number;
    user_id: number | null;
    order_code: string;
    order_date: Date;
    total_amount: number;
    shipping_fee: number;
    final_amount: number;
    shipping_address: string;
    payment_method_id: number;
    status: string;
    notes: string | null;
    created_at: Date | null
    updated_at: Date | null
    user?: IUser;
    payment_method?: IPaymentMethod;
    order_items?: IOrderItem[];
    
}

export const OrderSchema = new EntitySchema<IOrder>({
    name: 'Order',
    tableName: 'orders',
    columns: {
        order_id: {
            type: 'int',
            primary: true,
            generated: 'increment'
        },
        user_id: {
            type: 'int',
            nullable: true
        },
        order_code: {
            type: 'varchar',
            length: 30,
            unique: true
        },
        order_date: {
            type: 'timestamp',
            default: () => 'CURRENT_TIMESTAMP'
        },
        total_amount: {
            type: 'bigint'
        },
        shipping_fee: {
            type: 'bigint',
            default: 0
        },
        final_amount: {
            type: 'bigint'
        },
        shipping_address: {
            type: 'text'
        },
        payment_method_id: {
            type: 'int'
        },
        status: {
            type: 'varchar',
            default: 'Pending'
        },
        notes: {
            type: 'text',
            nullable: true
        },
        created_at: {
            type: 'timestamp',
            createDate: true, 
          },
          updated_at: {
            type: 'timestamp',
            updateDate: true, 
          },
    },
    relations: {
        user: {
            type: 'many-to-one',
            target: 'User',
            joinColumn: {
                name: 'user_id',
                referencedColumnName: 'user_id'
            },
            inverseSide: 'orders'
        },
        payment_method: {
            type: 'many-to-one',
            target: 'PaymentMethod',
            joinColumn: {
                name: 'payment_method_id',
                referencedColumnName: 'payment_method_id'
            },
            inverseSide: 'orders'
        },
        
        order_items: {
            type: 'one-to-many',
            target: 'OrderItem',
            inverseSide: 'order'
        }
    }
});

