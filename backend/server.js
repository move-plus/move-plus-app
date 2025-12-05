import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import meRoutes from './src/routes/me.js';
import demandsRoutes from './src/routes/demands.js';
import classesRoutes from './src/routes/classes.js';
import enrollmentsRoutes from './src/routes/enrollments.js';
import forumRoutes from './src/routes/forum.js';
import messagesRoutes from './src/routes/messages.js';

dotenv.config();

const app = express();

// CORS configurado para produção e desenvolvimento
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://seu-app.vercel.app', 'https://fitsenior.vercel.app'] // adicione sua URL da Vercel aqui
    : '*',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    message: 'FitSenior API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Prefixo /api pra tudo
app.use('/api', meRoutes);
app.use('/api', demandsRoutes);
app.use('/api', classesRoutes);
app.use('/api', enrollmentsRoutes);
app.use('/api', forumRoutes);
app.use('/api', messagesRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend rodando na porta ${port}`);
});
