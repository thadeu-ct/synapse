// api/signup.js
import bcrypt from "bcrypt";
// Verifique se este caminho está correto após a refatoração
import { supabase } from "../lib/database.js";

export default async function handler(req, res) {
  // --- BLOCO DE CÓDIGO ESSENCIAL PARA O CORS ---
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  // --- FIM DO BLOCO CORS ---

  if (req.method !== "POST") {
    return res.status(405).end(`Método ${req.method} não permitido`);
  }
  
  // Lógica do Signup
  const { nome, sobrenome, email, senha } = req.body;

  if (!nome || !sobrenome || !email || !senha) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }
  if (senha.length < 6) {
    return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" });
  }

  try {
    const { data: usuarioExistente } = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", email)
      .single();

    if (usuarioExistente) {
      return res.status(400).json({ error: "Este e-mail já está cadastrado" });
    }

    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    const { data: novoUsuario, error: insertError } = await supabase
      .from("usuarios")
      .insert([{ nome, sobrenome, email, senha: senhaHash }]) // Ajustar para senha_hash se já migrou
      .select("id, nome, sobrenome, email, created_at")
      .single();

    if (insertError) {
      throw insertError;
    }

    res.status(201).json({ message: "Conta criada com sucesso!", usuario: novoUsuario });

  } catch (err) {
    res.status(500).json({ error: `Erro no servidor: ${err.message}` });
  }
}