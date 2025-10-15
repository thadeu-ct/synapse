import { supabase } from "../lib/database.js"; // Importa o cliente Supabase configurado

export default async function handler(req, res) { 
  // Configura os cabeçalhos CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); 
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  } // backend responde as regras
  if (req.method !== "POST") {
    return res.status(405).end(`Método ${req.method} não permitido`);
  } // backend só aceita dados


  try { // Obter o token de autorização
    const { authorization } = req.headers;
    if (!authorization) {
      const erro = new Error('Não autorizado: token não fornecido.');
      erro.status = 401;
      throw erro;
    }
    // Extrai o token do cabeçalho
    const token = authorization.split(' ')[1];

    // Verifica quem é o usuário no Supabase usando o token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) { // se não acchar o usuário ou der erro
      const erro = new Error('Não autorizado: token inválido ou expirado.');
      erro.status = 401;
      throw erro;
    }

    // Processa a ação solicitada
    const { acao, ...dados } = req.body;

    switch (acao) {
      case 'edicao_senha':
        res.status(200).json({ message: "Lógica para mudar senha a ser implementada." });
        break;

      case 'edicao_email': 
        res.status(200).json({ message: "Lógica para mudar e-mail a ser implementada." });
        break;

      case 'cancelar_premium':
        res.status(200).json({ message: "Lógica para cancelar premium a ser implementada." });
        break;
      
      case 'deletar_conta':
        res.status(200).json({ message: "Lógica para deletar conta a ser implementada." });
        break;

      default: // ação não cadastrada
        res.status(400).json({ error: `Ação desconhecida: ${action}` });
    }

  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || "Erro no servidor ao processar a configuração." });
  }
}