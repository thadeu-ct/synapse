import { supabase } from "../lib/database.js";

export default async function handler(req, res) {
  // --- Bloco CORS ---
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { return res.status(204).end(); }
  if (req.method !== "POST") { return res.status(405).json({ error: "Método não permitido" }); }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "E-mail é obrigatório." });
  }

  try {
    // MUDANÇA: Usamos a função nativa do Supabase. 
    // Ela envia o e-mail real com o link de reset.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Onde o usuário vai cair depois de clicar no link do e-mail
      redirectTo: 'https://thadeu-ct.github.io/synapse/configuracoes.html',
    });

    if (error) {
      // Se der erro de limite de taxa (muitos pedidos), avisa
      if (error.status === 429) {
         return res.status(429).json({ error: "Muitas tentativas. Aguarde um pouco." });
      }
      throw error;
    }

    // Sucesso!
    res.status(200).json({ message: "Se o e-mail estiver cadastrado, o link foi enviado." });

  } catch (error) {
    console.error("Erro forgot-password:", error);
    res.status(500).json({ error: "Erro ao processar recuperação." });
  }
}