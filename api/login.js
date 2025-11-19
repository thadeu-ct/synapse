import { supabase } from "../lib/database.js";

export default async function handler(req, res) { 
  // --- Bloco CORS ---
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { return res.status(204).end(); }
  if (req.method !== "POST") { return res.status(405).end(`Método ${req.method} não permitido`); }

  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: "Informe e-mail e senha" });
  }

  try {
    // 1. Autentica no sistema de Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (authError || !authData.user) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    // 2. Busca o NOME na tabela pública 'usuarios' (Correção do 'undefined')
    const { data: profile } = await supabase
        .from('usuarios')
        .select('nome, sobrenome')
        .eq('id', authData.user.id)
        .single();

    // 3. Junta os dados para retornar
    // Se não achar perfil (raro), usa o que tem
    const usuarioCompleto = {
        ...authData.user,
        nome: profile?.nome || "", 
        sobrenome: profile?.sobrenome || ""
    };

    res.status(200).json({ 
      message: "Login realizado com sucesso!", 
      usuario: usuarioCompleto, // Agora contém o nome!
      token: authData.session.access_token
    });

  } catch (erro) {
    res.status(500).json({ error: `Erro no servidor: ${erro.message}` });
  }
}