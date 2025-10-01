// api/login.js
import bcrypt from "bcrypt";
import { supabase } from "../servidor/database.js"; // Ajustamos o caminho para a conexão

// A Vercel espera uma função exportada como default
export default async function handler(req, res) {
  // 1. Proteger o endpoint: só aceitar requisições POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Método ${req.method} não permitido`);
  }

  // 2. A lógica do login (exatamente a mesma que tínhamos!)
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