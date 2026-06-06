import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from './lib/auth.js';
import authRouter from './routes/auth.js';
import configRouter from './routes/config.js';
import scheduleRouter from './routes/schedule.js';
import daysRouter from './routes/days.js';
import statsRouter from './routes/stats.js';
import foodsRouter from './routes/foods.js';
import presetsRouter from './routes/presets.js';
import insightsRouter from './routes/insights.js';
import groceryRouter from './routes/grocery.js';
import remindersRouter from './routes/reminders.js';
import programmeRouter from './routes/programme.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Public — auth
app.use('/api/auth', authRouter);

// Protected — every API route below requires a valid JWT
app.use('/api/config', requireAuth, configRouter);
app.use('/api/schedule', requireAuth, scheduleRouter);
app.use('/api/days', requireAuth, daysRouter);
app.use('/api/stats', requireAuth, statsRouter);
app.use('/api/foods', requireAuth, foodsRouter);
app.use('/api/presets', requireAuth, presetsRouter);
app.use('/api/insights', requireAuth, insightsRouter);
app.use('/api/grocery', requireAuth, groceryRouter);
app.use('/api/reminders', requireAuth, remindersRouter);
app.use('/api/programme', requireAuth, programmeRouter);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
