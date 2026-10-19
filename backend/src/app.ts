import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger.json';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error';
import { config } from './config';

const app = express();

// Allow localhost origins for smooth development and hackathon demo
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded documents & sample test documents statically
app.use('/uploads', express.static(config.uploadDir));
app.use('/sample_documents', express.static(path.join(__dirname, '../../sample_documents')));

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ReconX-AI Backend API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', apiRoutes);

// Centralized error handler
app.use(errorHandler);

export default app;
