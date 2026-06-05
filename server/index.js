import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import configRouter from './routes/config.js';
import scheduleRouter from './routes/schedule.js';
import daysRouter from './routes/days.js';
import statsRouter from './routes/stats.js';
import foodsRouter from './routes/foods.js';
import presetsRouter from './routes/presets.js';
import insightsRouter from './routes/insights.js';
import groceryRouter from './routes/grocery.js';
import remindersRouter from './routes/reminders.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/config', configRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/days', daysRouter);
app.use('/api/stats', statsRouter);
app.use('/api/foods', foodsRouter);
app.use('/api/presets', presetsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/grocery', groceryRouter);
app.use('/api/reminders', remindersRouter);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
