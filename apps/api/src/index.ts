import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestLogger } from './common/logger.js';
import { errorHandler } from './common/errors.js';
import { healthRouter } from './modules/health/health.routes.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(helmet());
app.use(cors({ origin: process.env.WEB_URL ?? 'http://localhost:5173' }));
app.use(express.json());
app.use(requestLogger);

app.use('/health', healthRouter);

app.get('/', (_req, res) => {
  res.json({ name: 'Unified PMS API', status: 'ok' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
