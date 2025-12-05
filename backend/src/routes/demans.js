// src/routes/demands.js
import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/demands
 * Lista todas as demandas (qualquer usuário autenticado pode ver, pela policy RLS)
 */
router.get('/demands', requireAuth, async (req, res) => {
  const supabase = req.supabase;

  const { data, error } = await supabase
    .from('demands')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro /demands:', error);
    return res.status(500).json({ error: 'Erro ao buscar demands' });
  }

  res.json(data);
});

/**
 * POST /api/demands
 * (Opcional) Criar nova demanda – aqui você pode no futuro restringir por role
 */
router.post('/demands', requireAuth, async (req, res) => {
  const supabase = req.supabase;
  const { activity, neighborhood, schedule, location, num_interested } =
    req.body;

  const { data, error } = await supabase.from('demands').insert([
    {
      activity,
      neighborhood,
      schedule,
      location,
      num_interested: num_interested ?? 0,
    },
  ]);

  if (error) {
    console.error('Erro POST /demands:', error);
    return res.status(500).json({ error: 'Erro ao criar demanda' });
  }

  res.status(201).json(data[0]);
});

export default router;
