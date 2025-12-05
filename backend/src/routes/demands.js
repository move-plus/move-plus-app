import express from 'express';
import { authenticate } from '../middleware/auth.js';
import supabase from '../supabaseClient.js';

const router = express.Router();

// GET /api/demands - Lista todas as demandas
router.get('/demands', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('demands')
      .select('*, profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar demandas:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/demands/:id - Busca uma demanda específica
router.get('/demands/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('demands')
      .select('*, profiles(full_name, avatar_url)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar demanda:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/demands - Cria nova demanda
router.post('/demands', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('demands')
      .insert([{ ...req.body, user_id: req.user.id }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar demanda:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/demands/:id - Atualiza uma demanda
router.put('/demands/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('demands')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar demanda:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/demands/:id - Deleta uma demanda
router.delete('/demands/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('demands')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar demanda:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;