import { EntitySchema } from "typeorm";
import { IRole } from "src/roles/entities/role.entity";

export interface IAccount {
    account_id: number;
    email: string;
    password_hash: string;
    full_name: string | null;
    phone_number: string | null;
    role_id: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    role?: IRole;
}

export const AccountSchema = new EntitySchema<IAccount>({
    name: 'Account',
    tableName: 'accounts',
    columns: {
        account_id: {
            type: 'int',
            primary: true,
            generated: 'increment'
        },
        email: {
            type: 'varchar',
            length: 255,
            unique: true
        },
        password_hash: {
            type: 'varchar',
            length: 255,
             select: false,
        },
        full_name: {
            type: 'varchar',
            length: 150,
            nullable: true
        },
        phone_number: {
            type: 'varchar',
            length: 12,
            nullable: true
        },
        role_id: {
            type: 'int'
        },
        is_active: {
            type: 'boolean',
            default: true
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
        role: {
            type: 'many-to-one',
            target: 'Role',
            joinColumn: {
                name: 'role_id',
                referencedColumnName: 'role_id'
            },
            inverseSide: 'accounts'
        }
    }
});

