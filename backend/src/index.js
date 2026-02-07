import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { rateLimit } from 'express-rate-limit';
import logger from './logger.js';
import apiRoutes from './routes/api.js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = process.env.PORT || 4001;

// Read version from version.json
let version = '0.1.0';
try {
  const versionFile = readFileSync(resolve(__dirname, '../../version.json'), 'utf-8');
  version = JSON.parse(versionFile).version;
} catch {
  // Use default version
}

const buildTimestamp = new Date().toISOString();

// Middleware
app.use(helmet());
app.use(express.json());

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:4000', 'http://localhost:4001', 'capacitor://localhost'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Logging
app.use(pinoHttp({ logger }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health endpoint (public)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version,
    buildTimestamp,
  });
});

// API routes
app.use('/api', apiRoutes);

// Error handler
app.use((err, req, res, _next) => {
  req.log.error(err, 'Unhandled error');
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

app.listen(port, () => {
  logger.info(`Gimli backend listening on port ${port}`);
});

export default app;
