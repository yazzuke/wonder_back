export interface Product {
    id?: number;
    name: string;
    description?: string;
    category?: string;
    sku?: string;
    price: number;
    stock: number;
    image_url?: string;
    is_available?: boolean;
    created_at?: Date;
    updated_at?: Date;
}
