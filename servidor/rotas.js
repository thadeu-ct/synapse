// servidor/rotas.js
import express from "express"
import { cadastrarUsuario } from "./database.js"

const router = express.Router()

// Rota para cadastrar usuário
router.post("/cadastro", async (req, res) => {
  const { nome, sobrenome, email, senha } = req.body

  if (!nome || !email || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" })
  }

  const usuario = await cadastrarUsuario({ nome, sobrenome, email, senha })
  if (!usuario) {
    return res.status(500).json({ error: "Erro ao cadastrar usuário" })
  }

  res.json({ message: "Usuário cadastrado com sucesso!", usuario })
})

export default router
