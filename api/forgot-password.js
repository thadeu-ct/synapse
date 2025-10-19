// api/forgot-password.js
import crypto from "crypto";
import { supabase } from "../lib/database.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://thadeu-ct.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).end(`Método ${req.method} não permitido`);
  }

  const { email } = req.body || {};
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Informe um e-mail válido." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: "E-mail inválido." });
  }

  const resetToken = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString(); // 30 minutos

  try {
    const { error } = await supabase
      .from("password_resets")
      .insert({
        email: normalizedEmail,
        token: resetToken,
        expires_at: expiresAt,
        used: false
      });

    if (error) {
      // Se a tabela não existir ainda, apenas registra e segue com a resposta genérica.
      const missingTable = error?.message?.includes("relation") && error?.message?.includes("does not exist");
      if (!missingTable) {
        console.error("Erro ao registrar token de recuperação:", error);
        return res.status(500).json({ error: "Não foi possível iniciar a recuperação de senha." });
      }
    }

    // Em um cenário real, enviaríamos o e-mail aqui.
    return res.status(200).json({
      message: "Se o e-mail estiver cadastrado, enviaremos um link de recuperação em instantes.",
      tokenPreview: resetToken.slice(0, 6)
    });
  } catch (err) {
    console.error("Erro inesperado na recuperação de senha:", err);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}
