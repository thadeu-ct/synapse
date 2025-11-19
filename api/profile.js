import { supabase, supabaseAdmin } from "../lib/database.js"; // Importa o cliente Supabase configurado

export default async function handler(req, res) { 
  // Configura os cabeçalhos CORS para permitir requisições do frontend
  console.log(`[DEBUG] Recebi requisição em /api/profile. Método: ${req.method}`);
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  } 

  try {
    const { authorization } = req.headers;
    if (!authorization) {
      const erro = new Error('Não autorizado: token não fornecido.');
      erro.status = 401;
      throw erro;
    }

    const token = authorization.split(' ')[1];

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      const erro = new Error('Não autorizado: token inválido ou expirado.');
      erro.status = 401;
      throw erro;
    }
    
    if(req.method === 'GET'){
      const {
        data: perfil,
        error: fetchError
      } = await supabaseAdmin
        .from('usuarios').select('*').eq('id', user.id).maybeSingle();;
      
      if(fetchError) { throw fetchError; }

      if (!perfil) {
          return res.status(404).json({ error: "Perfil não encontrado." });
      }
      return res.status(200).json({perfil});
    }

    if(req.method === 'POST'){
      const { 
        nome, sobrenome, foto, bio, telefone, cidade, estado, formato_aula, 
        tag_ensinar, tag_aprender, disponibilidade, site_portfolio, linkedin 
      } = req.body;

      const { error: updateError } = await supabaseAdmin
        .from('usuarios')
        .update({
          nome, sobrenome, foto, bio, telefone, cidade, estado, formato_aula, 
          tag_ensinar, tag_aprender, disponibilidade, site_portfolio, linkedin,
          perfil_completo: true 
        })
        .eq('id', user.id);
      
      if (updateError) {
        const erro = new Error(`Erro ao atualizar perfil: ${updateError.message}`);
        erro.status = 500;
        throw erro;
      }

      return res.status(200).json({ message: "Perfil atualizado com sucesso!" });
    }
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  } 
  catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Erro no servidor ao atualizar perfil." });
  }
}