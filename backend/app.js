import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { connectToDB } from './db/db.js';
import jobRoutes from './routes/job.routes.js';

const app = express();
connectToDB();  // Connect to the database

// Middlewares
// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL, // Replace with your frontend's production URL
//     credentials: true, // Allow cookies/credentials
//   })
// );
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));  // This will correctly parse URL parameters
app.use(bodyParser.json()); // This will correctly parse JSON bodies sent in POST requests

// Routes
app.use('/jobs', jobRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

export default app;