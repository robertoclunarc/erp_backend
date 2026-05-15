import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';

// Importar rutas
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import branchRoutes from './routes/branchRoutes';
import cashRegisterRoutes from './routes/cashRegisterRoutes';
import saleRoutes from './routes/saleRoutes';
import productRoutes from './routes/productRoutes';
import purchaseRoutes from './routes/purchaseRoutes';
import stockRoutes from './routes/stockRoutes';
import reportRoutes from './routes/reportRoutes';
import serviceRoutes from './routes/serviceRoutes';
import { initializeDatabase } from './config/database';
import supplierRoutes from './routes/supplierRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/cash-register', cashRegisterRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/suppliers', supplierRoutes);

// Health check
app.get('/health', (req, res) => res.send('OK'));

// Manejo de errores
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`✅ Apis corriendo en puerto ${PORT}`);
  await initializeDatabase();
});