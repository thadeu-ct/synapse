// servidor/rotas.js
import express from "express"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"
import { cadastrarUsuario, supabase } from "./database.js"

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, "data")
const PROFILES_FILE = path.join(DATA_DIR, "perfis.json")

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(PROFILES_FILE)
  } catch {
    await fs.writeFile(PROFILES_FILE, "{}", "utf-8")
  }
}

const storeReady = ensureStore()

async function readProfiles() {
  await storeReady
  try {
    const raw = await fs.readFile(PROFILES_FILE, "utf-8")
    if (!raw.trim()) return {}
    return JSON.parse(raw)
  } catch (err) {
    console.warn("Falha ao ler perfis salvos:", err)
    return {}
  }
}

async function writeProfiles(db) {
  await storeReady
  await fs.writeFile(PROFILES_FILE, JSON.stringify(db, null, 2), "utf-8")
}

const asArray = (value) => Array.isArray(value)
  ? value.map(item => String(item || "").trim()).filter(Boolean)
  : []

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

router.get("/perfil/:email", async (req, res) => {
  const email = String(req.params?.email || "").trim().toLowerCase()
  if (!email) {
    return res.status(400).json({ error: "Informe um e-mail válido" })
  }

  try {
    const perfis = await readProfiles()
    const perfil = perfis[email]
    if (!perfil) {
      return res.status(404).json({ error: "Perfil não encontrado" })
    }
    return res.json({ perfil })
  } catch (err) {
    console.error("Erro ao carregar perfil:", err)
    return res.status(500).json({ error: "Falha ao carregar perfil" })
  }
})

router.post("/perfil", async (req, res) => {
  const payload = req.body || {}
  const email = String(payload.email || "").trim().toLowerCase()

  if (!email) {
    return res.status(400).json({ error: "E-mail é obrigatório" })
  }

  const perfil = {
    nome: String(payload.nome || "").trim(),
    sobrenome: String(payload.sobrenome || "").trim(),
    email,
    telefone: String(payload.telefone || "").trim(),
    cidade: String(payload.cidade || "").trim(),
    uf: String(payload.uf || "").trim().toUpperCase(),
    online: !!payload.online,
    presencial: !!payload.presencial,
    ensina: asArray(payload.ensina),
    aprende: asArray(payload.aprende),
    disponibilidade: asArray(payload.disponibilidade),
    bio: String(payload.bio || "").trim(),
    site: String(payload.site || "").trim(),
    linkedin: String(payload.linkedin || "").trim(),
    updatedAt: payload.updatedAt || new Date().toISOString()
  }

  try {
    const perfis = await readProfiles()
    perfis[email] = perfil
    await writeProfiles(perfis)
    return res.json({ message: "Perfil salvo", perfil })
  } catch (err) {
    console.error("Erro ao salvar perfil:", err)
    return res.status(500).json({ error: "Falha ao salvar perfil" })
  }
})

export default router
