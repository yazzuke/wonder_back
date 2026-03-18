import { pool } from '../config/database';
import { Product } from '../types/product';

export class ProductService {

    async getAll(): Promise<Product[]> {
        const result = await pool.query(
            'SELECT * FROM products ORDER BY created_at DESC'
        );
        return result.rows;
    }

    async getById(id: number): Promise<Product | null> {
        const result = await pool.query(
            'SELECT * FROM products WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
        const result = await pool.query(
            `INSERT INTO products (name, description, category, sku, price, stock, image_url, is_available)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                product.name,
                product.description || null,
                product.category || null,
                product.sku || null,
                product.price,
                product.stock,
                product.image_url || null,
                product.is_available ?? true
            ]
        );
        return result.rows[0];
    }

    async update(id: number, product: Partial<Product>): Promise<Product | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (product.name !== undefined) { fields.push(`name = $${paramCount++}`); values.push(product.name); }
        if (product.description !== undefined) { fields.push(`description = $${paramCount++}`); values.push(product.description); }
        if (product.category !== undefined) { fields.push(`category = $${paramCount++}`); values.push(product.category); }
        if (product.sku !== undefined) { fields.push(`sku = $${paramCount++}`); values.push(product.sku); }
        if (product.price !== undefined) { fields.push(`price = $${paramCount++}`); values.push(product.price); }
        if (product.stock !== undefined) { fields.push(`stock = $${paramCount++}`); values.push(product.stock); }
        if (product.image_url !== undefined) { fields.push(`image_url = $${paramCount++}`); values.push(product.image_url); }
        if (product.is_available !== undefined) { fields.push(`is_available = $${paramCount++}`); values.push(product.is_available); }

        if (fields.length === 0) return this.getById(id);

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await pool.query(
            `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    async delete(id: number): Promise<boolean> {
        const result = await pool.query(
            'DELETE FROM products WHERE id = $1',
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    }
}

export default new ProductService();
