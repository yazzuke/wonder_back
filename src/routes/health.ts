import { Router } from 'express';
import { pool } from '../config/database';


const router = Router();

router.get('/', (req, res) => {
    res.json({ status: 'Server is running' });
});

router.get('/db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            success: true, 
            message: 'Database connected',
            timestamp: result.rows[0].now 
        });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Database connection failed' 
        });
    }
});



export default router;