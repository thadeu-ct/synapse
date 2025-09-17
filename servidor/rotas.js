// servidor/rotas.js
import express from "express"
import { cadastrarUsuario, supabase } from "./database.js"

const router = express.Router()

// Rota para cadastrar usuário
router.post("/cadastro", async (req, res) => {
  const nome = String(req.body?.nome || "").trim()
  const sobrenome = String(req.body?.sobrenome || "").trim()
  const email = String(req.body?.email || "").trim().toLowerCase()
  const senha = String(req.body?.senha || "")

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" })
  }
  if (senha.length < 6) {
    return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" })
  }

  try {
    // Evita duplicidade por e-mail
    const { data: existente } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single()

    if (existente) {
      return res.status(400).json({ error: 'E-mail já cadastrado' })
    }

    const usuario = await cadastrarUsuario({ nome, sobrenome, email, senha })
    if (!usuario) {
      return res.status(500).json({ error: 'Erro ao cadastrar usuário' })
    }

    return res.json({ message: 'Usuário cadastrado com sucesso!', usuario })
  } catch (err) {
    return res.status(500).json({ error: 'Falha inesperada no cadastro' })
  }
})

export default router
