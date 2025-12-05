// src/routes/classes.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import supabase from '../supabaseClient.js';

const router = express.Router();

// GET /api/classes - Lista todas as aulas
router.get('/classes', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*, profiles(full_name)')
      .order('date', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar aulas:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/classes/:id - Busca uma aula específica
router.get('/classes/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*, profiles(full_name), enrollments(count)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar aula:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/classes - Cria nova aula (apenas instrutores)
router.post('/classes', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .insert([{ ...req.body, instructor_id: req.user.id }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/classes/:id - Atualiza uma aula
router.put('/classes/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('instructor_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao atualizar aula:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/classes/:id - Deleta uma aula
router.delete('/classes/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', req.params.id)
      .eq('instructor_id', req.user.id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar aula:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
