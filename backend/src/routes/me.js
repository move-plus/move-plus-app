// src/routes/me.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import supabase from '../supabaseClient.js';

const router = express.Router();

// GET /api/me - Retorna dados do usuário logado
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/me - Atualiza perfil do usuário
router.put('/me', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(req.body)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
