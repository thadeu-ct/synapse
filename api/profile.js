import { supabase } from "./_lib/database.js";

export default async function handler(req, res) {
  // --- Bloco CORS ---
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  // --- Fim do Bloco CORS ---

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }

  try {
    // 1. Obter o token de autorização
    const { authorization } = req.headers;
    if (!authorization) {
      const err = new Error('Não autorizado: token não fornecido.');
      err.status = 401;
      throw err;
    }
    const token = authorization.split(' ')[1];

    // 2. Usar o token para verificar quem é o usuário no Supabase.
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      const err = new Error('Não autorizado: token inválido ou expirado.');
      err.status = 401;
      throw err;
    }
    
    // 3. Pegar os dados do perfil (já feito no passo 4)
    // 4. Executar o UPDATE no banco de dados
    const { 
      foto, bio, telefone, cidade, estado, formato_aula, 
      tag_ensinar, tag_aprender, disponibilidade, site_portfolio, linkedin 
    } = req.body;

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        foto, bio, telefone, cidade, estado, formato_aula, 
        tag_ensinar, tag_aprender, disponibilidade, site_portfolio, linkedin,
        perfil_completo: true 
      })
      .eq('id', user.id);

    if (updateError) {
      const err = new Error(`Erro ao atualizar perfil: ${updateError.message}`);
      err.status = 500;
      throw err;
    }

    // 5. Retornar uma mensagem de sucesso.
    res.status(200).json({ message: "Perfil atualizado com sucesso!" });

  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Erro no servidor ao atualizar perfil." });
  }
}