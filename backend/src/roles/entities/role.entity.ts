import { EntitySchema } from "typeorm";
import { IAccount } from "src/accounts/entities/account.entity";


export interface IRole {
    role_id: number;
    role_name: string;
    description: string | null;
    accounts?: IAccount[];
}

export const RoleSchema = new EntitySchema<IRole>({
    name: 'Role',
    tableName: 'roles',
    columns: {
        role_id: {
            type: 'int',
            primary: true,
            generated: 'increment'
        },
        role_name: {
            type: 'varchar',
            length: 50,
            unique: true
        },
        description: {
            type: 'text',
            nullable: true
        }
    },
    relations: {
        accounts: {
            type: 'one-to-many',
            target: 'Account',
            inverseSide: 'role'
        },
        
    }
});

