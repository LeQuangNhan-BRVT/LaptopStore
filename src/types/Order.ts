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
    created_at: Date;
    updated_at: Date;
    orders?: IOrder[];
}

export interface IPaymentMethod {
    payment_method_id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    orders?: IOrder[];
}


export interface ICategories {
    category_id: number;
    name: string;
    description: string | null;
    productCate?: IProduct[];
    
    deleted_at: Date | null;
}

export interface IProduct{
    product_id: number;
    sku: string;
    name: string;
    brand_id: number;
    category_id: number;
    price: number;
    sale_price: number | null;
    quantity: number;
    description: string | null;
    is_active: boolean;
    primary_image?: string | null;
    created_at: Date;
    updated_at: Date;
    deleted_at: Date | null;
    // brand?: IBrand;
    // appliedDiscounts?: IDiscount[];
    // category?: ICategories;
    // product_tag?: ITag[];
    // specification?: IProductSpecification;
    // images?: IProductImage[];
}

export interface IOrderItem {
    order_item_id: number;
    order_id: number;
    product_id: number;
    quantity: number;
    price_at_purchase: number;
    order?: IOrder;
    product?: IProduct;
}

export interface IOrder {
    order_id: number;
    user_id: number | null;
    order_code: string;
    order_date: Date;
    total_amount: number;
    shipping_fee: number;
    discount_id: number | null;
    final_amount: number;
    shipping_address: string;
    payment_method_id: number;
    status: string;
    notes: string | null;
    created_at:  | string 
    updated_at: Date |string
    user?: IUser;
    payment_method?: IPaymentMethod;
    order_items?: IOrderItem[];
    
}
