import { pool } from '../config/database';
import { Order, OrderStatus } from '../types/order';

export class OrderService {

    async getAll(): Promise<Order[]> {
        const result = await pool.query(
            'SELECT * FROM orders ORDER BY created_at DESC'
        );
        return result.rows;
    }

    async getById(id: number): Promise<Order | null> {
        const result = await pool.query(
            'SELECT * FROM orders WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    async getByStatus(status: OrderStatus): Promise<Order[]> {
        const result = await pool.query(
            'SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC',
            [status]
        );
        return result.rows;
    }

    async create(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
        const result = await pool.query(
            `INSERT INTO orders (order_number, customer_name, status, items, total, notes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                order.order_number,
                order.customer_name || null,
                order.status || 'preparing',
                JSON.stringify(order.items),
                order.total,
                order.notes || null
            ]
        );
        return result.rows[0];
    }

    async updateStatus(id: number, status: OrderStatus): Promise<Order | null> {
        const result = await pool.query(
            `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 RETURNING *`,
            [status, id]
        );
        return result.rows[0] || null;
    }

    async update(id: number, order: Partial<Order>): Promise<Order | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (order.order_number !== undefined) { fields.push(`order_number = $${paramCount++}`); values.push(order.order_number); }
        if (order.customer_name !== undefined) { fields.push(`customer_name = $${paramCount++}`); values.push(order.customer_name); }
        if (order.status !== undefined) { fields.push(`status = $${paramCount++}`); values.push(order.status); }
        if (order.items !== undefined) { fields.push(`items = $${paramCount++}`); values.push(JSON.stringify(order.items)); }
        if (order.total !== undefined) { fields.push(`total = $${paramCount++}`); values.push(order.total); }
        if (order.notes !== undefined) { fields.push(`notes = $${paramCount++}`); values.push(order.notes); }

        if (fields.length === 0) return this.getById(id);

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await pool.query(
            `UPDATE orders SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    async delete(id: number): Promise<boolean> {
        const result = await pool.query(
            'DELETE FROM orders WHERE id = $1',
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async getNextOrderNumber(): Promise<number> {
        const result = await pool.query(
            'SELECT COALESCE(MAX(order_number), 100) + 1 AS next_number FROM orders'
        );
        return result.rows[0].next_number;
    }

    async getBoard(): Promise<{ preparing: number[]; ready: number[] }> {
        const result = await pool.query(
            `SELECT order_number, status FROM orders
             WHERE status IN ('preparing', 'ready')
             ORDER BY created_at ASC`
        );

        const preparing: number[] = [];
        const ready: number[] = [];

        for (const row of result.rows) {
            if (row.status === 'preparing') preparing.push(row.order_number);
            else if (row.status === 'ready') ready.push(row.order_number);
        }

        return { preparing, ready };
    }
}

export default new OrderService();
