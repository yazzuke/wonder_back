import { pool } from '../config/database';
import { MenuItem } from '../types/menuItem';

export class MenuItemService {

    async getAll(): Promise<MenuItem[]> {
        const result = await pool.query(
            'SELECT * FROM menu_items_new WHERE is_active = true ORDER BY sort_order ASC, name ASC'
        );
        return result.rows;
    }

    async getById(id: number): Promise<MenuItem | null> {
        const result = await pool.query(
            'SELECT * FROM menu_items_new WHERE id = $1',
            [id]
        );
        return result.rows[0] || null;
    }

    async getByMenu(menu: string): Promise<MenuItem[]> {
        const result = await pool.query(
            'SELECT * FROM menu_items_new WHERE menu = $1 AND is_active = true ORDER BY sort_order ASC, name ASC',
            [menu]
        );
        return result.rows;
    }

    async getByCategory(category: string): Promise<MenuItem[]> {
        const result = await pool.query(
            'SELECT * FROM menu_items_new WHERE category = $1 AND is_active = true ORDER BY sort_order ASC, name ASC',
            [category]
        );
        return result.rows;
    }

    async create(item: Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>): Promise<MenuItem> {
        const result = await pool.query(
            `INSERT INTO menu_items_new (pos_id, menu, item_type, category, parent_group, name, description, price, in_stock, out_of_stock_icon, sort_order, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [
                item.pos_id,
                item.menu,
                item.item_type,
                item.category || null,
                item.parent_group || null,
                item.name,
                item.description || null,
                item.price ?? null,
                item.in_stock ?? true,
                item.out_of_stock_icon || null,
                item.sort_order ?? null,
                item.is_active ?? true
            ]
        );
        return result.rows[0];
    }

    async update(id: number, item: Partial<MenuItem>): Promise<MenuItem | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (item.pos_id !== undefined) { fields.push(`pos_id = $${paramCount++}`); values.push(item.pos_id); }
        if (item.menu !== undefined) { fields.push(`menu = $${paramCount++}`); values.push(item.menu); }
        if (item.item_type !== undefined) { fields.push(`item_type = $${paramCount++}`); values.push(item.item_type); }
        if (item.category !== undefined) { fields.push(`category = $${paramCount++}`); values.push(item.category); }
        if (item.parent_group !== undefined) { fields.push(`parent_group = $${paramCount++}`); values.push(item.parent_group); }
        if (item.name !== undefined) { fields.push(`name = $${paramCount++}`); values.push(item.name); }
        if (item.description !== undefined) { fields.push(`description = $${paramCount++}`); values.push(item.description); }
        if (item.price !== undefined) { fields.push(`price = $${paramCount++}`); values.push(item.price); }
        if (item.in_stock !== undefined) { fields.push(`in_stock = $${paramCount++}`); values.push(item.in_stock); }
        if (item.out_of_stock_icon !== undefined) { fields.push(`out_of_stock_icon = $${paramCount++}`); values.push(item.out_of_stock_icon); }
        if (item.sort_order !== undefined) { fields.push(`sort_order = $${paramCount++}`); values.push(item.sort_order); }
        if (item.is_active !== undefined) { fields.push(`is_active = $${paramCount++}`); values.push(item.is_active); }

        if (fields.length === 0) return this.getById(id);

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await pool.query(
            `UPDATE menu_items_new SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );
        return result.rows[0] || null;
    }

    async toggleStock(id: number, inStock: boolean): Promise<MenuItem | null> {
        const result = await pool.query(
            `UPDATE menu_items_new SET in_stock = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 RETURNING *`,
            [inStock, id]
        );
        return result.rows[0] || null;
    }

    async delete(id: number): Promise<boolean> {
        const result = await pool.query(
            'DELETE FROM menu_items_new WHERE id = $1',
            [id]
        );
        return (result.rowCount ?? 0) > 0;
    }
}

export default new MenuItemService();
