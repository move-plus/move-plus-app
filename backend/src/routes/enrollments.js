import express from 'express';
import { authenticate } from '../middleware/auth.js';
import supabase from '../supabaseClient.js';

const router = express.Router();

// GET /api/enrollments - Lista inscrições do usuário
router.get('/enrollments', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, classes(*, profiles(full_name))')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar inscrições:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/enrollments/class/:classId - Lista inscritos em uma aula
router.get('/enrollments/class/:classId', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('class_id', req.params.classId);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar inscritos:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/enrollments - Inscreve-se em uma aula
router.post('/enrollments', authenticate, async (req, res) => {
  try {
    const { class_id } = req.body;

    // Verifica se já está inscrito
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('class_id', class_id)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Já inscrito nesta aula' });
    }

    // Verifica vagas disponíveis
    const { data: classData } = await supabase
      .from('classes')
      .select('capacity')
      .eq('id', class_id)
      .single();

    const { count } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', class_id);

    if (count >= classData.capacity) {
      return res.status(400).json({ error: 'Aula lotada' });
    }

    // Cria inscrição
    const { data, error } = await supabase
      .from('enrollments')
      .insert([{ user_id: req.user.id, class_id }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar inscrição:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/enrollments/:id - Cancela inscrição
router.delete('/enrollments/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao cancelar inscrição:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;