// api/login.js
import bcrypt from "bcrypt";
// Verifique se este caminho está correto após a refatoração
import { supabase } from "../../lib/database.js";

export default async function handler(req, res) {
  // --- BLOCO DE CÓDIGO ESSENCIAL PARA O CORS ---
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responde ao "preflight request" do navegador
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  // --- FIM DO BLOCO CORS ---

  if (req.method !== "POST") {
    return res.status(405).end(`Método ${req.method} não permitido`);
  }

  // Lógica do Login
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: "Informe e-mail e senha" });
  }

  try {
    const { data: usuario, error: selectError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .single();

    if (selectError || !usuario) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash || usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    delete usuario.senha;
    delete usuario.senha_hash;
    res.status(200).json({ message: "Login realizado com sucesso!", usuario: usuario });

  } catch (err) {
    res.status(500).json({ error: `Erro no servidor: ${err.message}` });
  }
}