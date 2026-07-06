import express from 'express';
import { apiRouter } from '../src/api/index';

const app = express();
app.use(express.json());
app.use('/api/tools', apiRouter);

export default app;
