import { supabase } from "../lib/database.js"; // Importa o cliente Supabase configurado

export default async function handler(req, res) { 
  // Configura os cabeçalhos CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  } // backend respode as regras
  if (req.method !== "POST") {
    return res.status(405).end(`Método ${req.method} não permitido`);
  } // backend só aceita dados

  try {
    // Obter o token de autorização
    const { authorization } = req.headers;
    if (!authorization) {
      const erro = new Error('Não autorizado: token não fornecido.');
      erro.status = 401;
      throw erro;
    }
    const token = authorization.split(' ')[1];

    // Procurar o usuário pelo token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      const erro = new Error('Não autorizado: token inválido ou expirado.');
      erro.status = 401;
      throw erro;
    }
    
    // Pega os dados de atualização passado pelo frontend
    const { 
      foto, bio, telefone, cidade, estado, formato_aula, 
      tag_ensinar, tag_aprender, disponibilidade, site_portfolio, linkedin 
    } = req.body;

    // Executa UPDATE dos dados na tabela "usuarios"
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        foto, bio, telefone, cidade, estado, formato_aula, 
        tag_ensinar, tag_aprender, disponibilidade, site_portfolio, linkedin,
        perfil_completo: true 
      })
      .eq('id', user.id);
    
    // Erro na atualização
    if (updateError) {
      const erro = new Error(`Erro ao atualizar perfil: ${updateError.message}`);
      erro.status = 500;
      throw erro;
    }

    // Retornar uma mensagem de sucesso.
    res.status(200).json({ message: "Perfil atualizado com sucesso!" });
    
    // Retorna mensagem de erro 
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Erro no servidor ao atualizar perfil." });
  }
}