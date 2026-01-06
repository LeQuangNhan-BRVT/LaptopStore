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
    
}