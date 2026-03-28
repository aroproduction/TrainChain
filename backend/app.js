import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import compression from 'compression';
import { connectToDB } from './db/db.js';
import jobRoutes from './routes/job.routes.js';

const app = express();

app.use(cors());
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '10mb' }));

connectToDB();

app.use('/jobs', jobRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;