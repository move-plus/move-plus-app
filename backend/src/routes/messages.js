// src/routes/messages.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import supabase from '../supabaseClient.js';

const router = express.Router();

/**
 * GET /api/messages/conversations
 * Lista conversas do usuário
 */
router.get('/messages/conversations', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url),
        recipient:profiles!messages_recipient_id_fkey(id, full_name, avatar_url)
      `)
      .or(`sender_id.eq.${req.user.id},recipient_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Agrupa por conversa (último contato)
    const conversations = {};
    data.forEach(msg => {
      const otherUserId = msg.sender_id === req.user.id ? msg.recipient_id : msg.sender_id;
      if (!conversations[otherUserId]) {
        conversations[otherUserId] = msg;
      }
    });

    res.json(Object.values(conversations));
  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/messages/:userId
 * Lista mensagens com usuário específico
 */
router.get('/messages/:userId', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name, avatar_url),
        recipient:profiles!messages_recipient_id_fkey(full_name, avatar_url)
      `)
      .or(`and(sender_id.eq.${req.user.id},recipient_id.eq.${req.params.userId}),and(sender_id.eq.${req.params.userId},recipient_id.eq.${req.user.id})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/messages
 * Envia nova mensagem
 */
router.post('/messages', authenticate, async (req, res) => {
  try {
    const { recipient_id, content } = req.body;

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_id: req.user.id,
        recipient_id,
        content
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/messages/:id/read
 * Marca mensagem como lida
 */
router.put('/messages/:id/read', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', req.params.id)
      .eq('recipient_id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Erro ao marcar como lida:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
