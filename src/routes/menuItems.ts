import { Router, Request, Response } from 'express';
import menuItemService from '../service/MenuItemService';

const router = Router();

// GET - Listar todos los menu items
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { menu, category } = req.query;

        if (menu) {
            const items = await menuItemService.getByMenu(menu as string);
            res.json({ success: true, data: items });
            return;
        }

        if (category) {
            const items = await menuItemService.getByCategory(category as string);
            res.json({ success: true, data: items });
            return;
        }

        const items = await menuItemService.getAll();
        res.json({ success: true, data: items });
    } catch (error) {
        console.error('Error getting menu items:', error);
        res.status(500).json({ success: false, message: 'Error al obtener menu items' });
    }
});

// GET - Obtener menu item por ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'ID inválido' });
            return;
        }

        const item = await menuItemService.getById(id);
        if (!item) {
            res.status(404).json({ success: false, message: 'Menu item no encontrado' });
            return;
        }

        res.json({ success: true, data: item });
    } catch (error) {
        console.error('Error getting menu item:', error);
        res.status(500).json({ success: false, message: 'Error al obtener menu item' });
    }
});

// POST - Crear menu item
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { pos_id, menu, item_type, name } = req.body;

        if (!pos_id || !menu || !item_type || !name) {
            res.status(400).json({ success: false, message: 'pos_id, menu, item_type y name son requeridos' });
            return;
        }

        const item = await menuItemService.create(req.body);
        res.status(201).json({ success: true, data: item });
    } catch (error: any) {
        console.error('Error creating menu item:', error);
        if (error.code === '23505') {
            res.status(400).json({ success: false, message: 'El pos_id ya existe' });
            return;
        }
        res.status(500).json({ success: false, message: 'Error al crear menu item' });
    }
});

// PUT - Actualizar menu item
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'ID inválido' });
            return;
        }

        const item = await menuItemService.update(id, req.body);
        if (!item) {
            res.status(404).json({ success: false, message: 'Menu item no encontrado' });
            return;
        }

        res.json({ success: true, data: item });
    } catch (error: any) {
        console.error('Error updating menu item:', error);
        if (error.code === '23505') {
            res.status(400).json({ success: false, message: 'El pos_id ya existe' });
            return;
        }
        res.status(500).json({ success: false, message: 'Error al actualizar menu item' });
    }
});

// PATCH - Toggle stock (in_stock true/false)
router.patch('/:id/stock', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'ID inválido' });
            return;
        }

        const { in_stock } = req.body;
        if (typeof in_stock !== 'boolean') {
            res.status(400).json({ success: false, message: 'in_stock debe ser true o false' });
            return;
        }

        const item = await menuItemService.toggleStock(id, in_stock);
        if (!item) {
            res.status(404).json({ success: false, message: 'Menu item no encontrado' });
            return;
        }

        res.json({ success: true, data: item });
    } catch (error) {
        console.error('Error toggling stock:', error);
        res.status(500).json({ success: false, message: 'Error al cambiar stock' });
    }
});

// DELETE - Eliminar menu item
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'ID inválido' });
            return;
        }

        const deleted = await menuItemService.delete(id);
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Menu item no encontrado' });
            return;
        }

        res.json({ success: true, message: 'Menu item eliminado' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar menu item' });
    }
});

export default router;
