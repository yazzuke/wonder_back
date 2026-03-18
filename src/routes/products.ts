import { Router, Request, Response } from 'express';
import productService from '../service/ProductService';

const router = Router();

// GET - Obtener todos los productos
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const products = await productService.getAll();
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ success: false, message: 'Error al obtener productos' });
    }
});

// GET - Obtener producto por ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'ID inválido' });
            return;
        }

        const product = await productService.getById(id);
        if (!product) {
            res.status(404).json({ success: false, message: 'Producto no encontrado' });
            return;
        }

        res.json({ success: true, data: product });
    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({ success: false, message: 'Error al obtener producto' });
    }
});

// POST - Crear producto
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, description, category, sku, price, stock, image_url, is_available } = req.body;

        if (!name || price === undefined) {
            res.status(400).json({ success: false, message: 'Nombre y precio son requeridos' });
            return;
        }

        const product = await productService.create({
            name, description, category, sku,
            price: parseFloat(price),
            stock: parseInt(stock) || 0,
            image_url, is_available
        });

        res.status(201).json({ success: true, data: product });
    } catch (error: any) {
        console.error('Error creating product:', error);
        if (error.code === '23505') {
            res.status(400).json({ success: false, message: 'El SKU ya existe' });
            return;
        }
        res.status(500).json({ success: false, message: 'Error al crear producto' });
    }
});

// PUT - Actualizar producto
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'ID inválido' });
            return;
        }

        const product = await productService.update(id, req.body);
        if (!product) {
            res.status(404).json({ success: false, message: 'Producto no encontrado' });
            return;
        }

        res.json({ success: true, data: product });
    } catch (error: any) {
        console.error('Error updating product:', error);
        if (error.code === '23505') {
            res.status(400).json({ success: false, message: 'El SKU ya existe' });
            return;
        }
        res.status(500).json({ success: false, message: 'Error al actualizar producto' });
    }
});

// DELETE - Eliminar producto
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'ID inválido' });
            return;
        }

        const deleted = await productService.delete(id);
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Producto no encontrado' });
            return;
        }

        res.json({ success: true, message: 'Producto eliminado' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar producto' });
    }
});

export default router;
