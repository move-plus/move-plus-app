import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mxegxtsndzuxmxdittgg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZWd4dHNuZHp1eG14ZGl0dGdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MjM3MDQsImV4cCI6MjA4MDk5OTcwNH0.YVuFvCQD_10HvQtD5WBYiuZ4R4JzNXk3NvCVEp4ab6k'
);

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro ao autenticar' });
  }
};

export default authenticate;
