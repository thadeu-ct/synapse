import { supabase } from "../lib/database.js"; // Importa o cliente Supabase configurado

export default async function handler(req, res) { 
  // Configura os cabeçalhos CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  } // backend respode as regras
  if (req.method !== "POST") {
    return res.status(405).end(`Método ${req.method} não permitido`);
  } // backend só aceita dados

  const { email, senha } = req.body;

  // Verifica se os campos estão preenchidos
  if (!email || !senha) {
    return res.status(400).json({ error: "Informe e-mail e senha" });
  }

  try {
    // Procura o usuário pelo e-mail
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (error || !data.user) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    res.status(200).json({ 
      message: "Login realizado com sucesso!", 
      usuario: data.user,
      token: data.session.access_token
    });

    // Retorna mensagem de erro
  } catch (erro) {
    res.status(500).json({ error: `Erro no servidor: ${erro.message}` });
  }
}