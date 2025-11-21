import { supabase } from "../lib/database.js";

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { return res.status(204).end(); }

  try {
    // 1. Autenticação
    const { authorization } = req.headers;
    if (!authorization) return res.status(401).json({ error: 'Não autorizado' });
    const token = authorization.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Token inválido' });

    // 2. Descobrir se o usuário logado é Premium
    const { data: me } = await supabase
        .from('usuarios')
        .select('eh_premium')
        .eq('id', user.id)
        .single();

    const isPremium = me?.eh_premium || false;

    // 3. Buscar candidatos (matches)
    // Pegamos ID, Nome, Bio, Foto, Tags... e excluímos o próprio usuário
    let query = supabase
        .from('usuarios')
        .select('id, nome, bio, foto, tag_ensinar, tag_aprender, formato_aula')
        .neq('id', user.id);
        // Aqui poderíamos adicionar lógica de filtro (ex: tags), mas pro MVP traz todos.

    // 4. Limitar se for Free
    // Se for Free, trazemos apenas 3. Se for Premium, trazemos 20.
    const limit = isPremium ? 20 : 3;
    
    const { data: perfis, error: matchError } = await query.limit(limit);
    
    if (matchError) throw matchError;

    // 5. Retornar
    res.status(200).json({ 
        matches: perfis, 
        isPremium: isPremium,
        limitReached: !isPremium && perfis.length >= 3 // Flag para o front saber se mostra o bloqueio
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}