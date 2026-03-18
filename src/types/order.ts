export interface OrderItem {
    product_id: number;
    quantity: number;
    unit_price: number;
}

export type OrderStatus = 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
    id?: number;
    order_number: number;
    customer_name?: string;
    status: OrderStatus;
    items: OrderItem[];
    total: number;
    notes?: string;
    created_at?: Date;
    updated_at?: Date;
}
