// api/login.js
import bcrypt from "bcrypt";
import { supabase } from "../lib/database.js";

export default async function handler(req, res) {
  // --- Configuração do CORS ---
  // Adicionamos o endereço do seu site na lista de permissões.
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  // Dizemos quais métodos (verbos) são permitidos.
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  // Dizemos quais cabeçalhos o frontend pode enviar.
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // --- Tratamento do "Preflight" Request ---
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Se a requisição não for POST, rejeitamos
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).end(`Método ${req.method} não permitido`);
  }

  // --- Lógica do Login ---
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

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ error: "E-mail ou senha inválidos" });
    }

    delete usuario.senha;
    res.status(200).json({ message: "Login realizado com sucesso!", usuario: usuario });

  } catch (err) {
    res.status(500).json({ error: `Erro no servidor: ${err.message}` });
  }
}