export interface IUser {
    user_id: number;
    full_name: string;
    email: string;
    password_hash: string | null;
    phone_number: string | null;
    address: string | null;
    avatar_url: string | null;
    birthday: Date | null;
    provider: string;
    provider_id: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    
}