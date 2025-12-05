// src/routes/forum.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import supabase from '../supabaseClient.js';

const router = express.Router();

/**
 * GET /api/forum/posts - Lista posts do fórum
 */
router.get('/forum/posts', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*, profiles(full_name, avatar_url), forum_replies(count)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/forum/posts/:id - Busca post específico com respostas
 */
router.get('/forum/posts/:id', authenticate, async (req, res) => {
  try {
    const { data: post, error: postError } = await supabase
      .from('forum_posts')
      .select('*, profiles(full_name, avatar_url)')
      .eq('id', req.params.id)
      .single();

    if (postError) throw postError;

    const { data: replies, error: repliesError } = await supabase
      .from('forum_replies')
      .select('*, profiles(full_name, avatar_url)')
      .eq('post_id', req.params.id)
      .order('created_at', { ascending: true });

    if (repliesError) throw repliesError;

    res.json({ ...post, replies });
  } catch (error) {
    console.error('Erro ao buscar post:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/forum/posts - Cria novo post
 */
router.post('/forum/posts', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .insert([{ ...req.body, user_id: req.user.id }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar post:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/forum/posts/:id/replies - Adiciona resposta a um post
 */
router.post('/forum/posts/:id/replies', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('forum_replies')
      .insert([{
        ...req.body,
        post_id: req.params.id,
        user_id: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao criar resposta:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/forum/posts/:id - Deleta post
 */
router.delete('/forum/posts/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase
      .from('forum_posts')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar post:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
