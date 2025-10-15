import { supabase } from "../lib/database.js"; // Importa o cliente Supabase configurado

export default async function handler(req, res) { 
  // Configura os cabeçalhos CORS para permitir requisições do frontend
  //CORS: (Cross-Origin Resource Sharing)
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io'); // frontend tem acesso ao backend
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // frontend pode perguntar as regras e enviar dados
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // frontend pode enviar JSON
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  } // backend respode as regras
  if (req.method !== "POST") {
    return res.status(405).end(`Método ${req.method} não permitido`);
  } // backend só aceita dados

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