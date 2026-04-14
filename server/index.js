import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger.js';

import chatRouter from './routes/chat.js';
import sessionsRouter from './routes/sessions.js';
import memoryRouter from './routes/memory.js';
import skillsRouter from './routes/skills.js';
import configRouter from './routes/config.js';
import statusRouter from './routes/status.js';
import jobsRouter from './routes/jobs.js';
import channelsRouter from './routes/channels.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', chatRouter);
app.use('/api', configRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/status', statusRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/channels', channelsRouter);

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.use((err, _req, res, _next) => {
  logger.error('server', `Unhandled error`, err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Hermes Web server running on http://localhost:${PORT}`);
});
