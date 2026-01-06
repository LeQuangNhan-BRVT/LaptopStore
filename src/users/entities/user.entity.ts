import { EntitySchema } from "typeorm";
import { IOrder } from "src/orders/entities/order.entity";

export interface IUser {
    user_id: number;
    full_name: string;
    email: string;
    password_hash: string | null;
    phone_number: string | null;
    address: string | null;
    provider: 'local'|'facebook'|'google';
    provider_id: string | null;
    is_active: boolean;
    reset_token: string | null;
    created_at: Date;
    updated_at: Date;
    orders?: IOrder[];
}

export const UserSchema = new EntitySchema<IUser>({
    name: 'User',
    tableName: 'users',
    columns: {
        user_id: {
            type: 'int',
            primary: true,
            generated: 'increment'
        },
        full_name: {
            type: 'varchar',
            length: 150
        },
        email: {
            type: 'varchar',
            length: 255,
            unique: true
        },
        password_hash: {
            type: 'varchar',
            length: 255,
            nullable: true,
            select: false
        },
        phone_number: {
            type: 'varchar',
            length: 12,
            nullable: true,
            unique: true
        },
        address: {
            type: 'text',
            nullable: true
        },
        provider: {
            type: 'varchar',
            length: 50,
            default: 'local'
        },
        provider_id: {
            type: 'varchar',
            length: 255,
            nullable: true
        },
        is_active: {
            type: 'boolean',
            default: true
        },
        reset_token: {
            type: 'varchar',
            length: 255,
            nullable: true
        },
        created_at: {
            type: 'timestamp',
            default: () => 'CURRENT_TIMESTAMP'
        },
        updated_at: {
            type: 'timestamp',
            default: () => 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP'
        }
    },
    relations: {
        orders: {
            type: 'one-to-many',
            target: 'Order',
            inverseSide: 'user'
        }
    }
});

