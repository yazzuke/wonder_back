import { Router, Request, Response } from 'express';
import orderService from '../service/OrderService';
import { OrderStatus } from '../types/order';

const router = Router();

const validStatuses: OrderStatus[] = ['preparing', 'ready', 'delivered', 'cancelled'];

// GET - Board: pantalla de estado de órdenes (preparing / ready)
router.get('/board', async (req: Request, res: Response): Promise<void> => {
    try {
        const board = await orderService.getBoard();
        res.json({ success: true, data: board });
    } catch (error) {
        console.error('Error getting order board:', error);
        res.status(500).json({ success: false, message: 'Error al obtener board de órdenes' });
    }
});

// GET - Obtener todas las órdenes
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { status } = req.query;

        if (status) {
            if (!validStatuses.includes(status as OrderStatus)) {
                res.status(400).json({ success: false, message: 'Estado inválido. Valores permitidos: preparing, ready, delivered, cancelled' });
                return;
            }
            const orders = await orderService.getByStatus(status as OrderStatus);
            res.json({ success: true, data: orders });
            return;
        }

        const orders = await orderService.getAll();
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json({ success: false, message: 'Error al obtener órdenes' });
    }
});

// GET - Obtener orden por ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'ID inválido' });
            return;
        }

        const order = await orderService.getById(id);
        if (!order) {
            res.status(404).json({ success: false, message: 'Orden no encontrada' });
            return;
        }

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Error getting order:', error);
        res.status(500).json({ success: false, message: 'Error al obtener orden' });
    }
});

// POST - Crear orden
router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const { customer_name, items, total, notes } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            res.status(400).json({ success: false, message: 'Items son requeridos' });
            return;
        }

        const order_number = await orderService.getNextOrderNumber();

        const order = await orderService.create({
            order_number,
            customer_name,
            status: 'preparing',
            items,
            total: parseFloat(total) || 0,
            notes
        });

        res.status(201).json({ success: true, data: order });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Error al crear orden' });
    }
});

// PATCH - Actualizar estado de la orden (preparing -> ready -> delivered)
router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'ID inválido' });
            return;
        }

        const { status } = req.body;
        if (!status || !validStatuses.includes(status)) {
            res.status(400).json({ success: false, message: 'Estado inválido. Valores permitidos: preparing, ready, delivered, cancelled' });
            return;
        }

        const order = await orderService.updateStatus(id, status);
        if (!order) {
            res.status(404).json({ success: false, message: 'Orden no encontrada' });
            return;
        }

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar estado de la orden' });
    }
});

// PUT - Actualizar orden completa
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'ID inválido' });
            return;
        }

        const order = await orderService.update(id, req.body);
        if (!order) {
            res.status(404).json({ success: false, message: 'Orden no encontrada' });
            return;
        }

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ success: false, message: 'Error al actualizar orden' });
    }
});

// DELETE - Eliminar orden
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'ID inválido' });
            return;
        }

        const deleted = await orderService.delete(id);
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Orden no encontrada' });
            return;
        }

        res.json({ success: true, message: 'Orden eliminada' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ success: false, message: 'Error al eliminar orden' });
    }
});

export default router;
