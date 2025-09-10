import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import rotas from "./rotas.js";
import { supabase } from "./database.js";
import bcrypt from "bcrypt";

const app = express();
const PORT = 3000;

// middlewares
app.use(cors());
app.use(bodyParser.json());

// rotas principais da API
app.use("/api", rotas);

// rota inicial
app.get("/", (req, res) => {
  res.send("🚀 Servidor online!");
});

// rota para listar usuários (teste Supabase)
app.get("/usuarios", async (req, res) => {
  try {
    const { data, error } = await supabase.from("usuarios").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ----------------- ROTAS DE AUTENTICAÇÃO ----------------- //

// rota de signup
app.post("/signup", async (req, res) => {
  const { nome, sobrenome, email, senha } = req.body;

  if (!nome || !sobrenome || !email || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  try {
    // verifica se email já existe
    const { data: existente } = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", email)
      .single();

    if (existente) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    // insere no banco
    const { data, error } = await supabase
      .from("usuarios")
      .insert([{ nome, sobrenome, email, senha }]) // depois vamos trocar para senha hash
      .select()
      .single();

    if (error) throw error;

    res.json({ message: "Conta criada com sucesso!", usuario: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// rota de login
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: "Informe email e senha" });
  }

  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .eq("senha", senha) // depois criptografar
      .single();

    if (error || !data) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }

    res.json({ message: "Login OK", usuario: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------------- //


// inicialização do servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});


// ----------------- ROTAS DE AUTENTICAÇÃO COM BCRYPT ----------------- //


// rota de signup
app.post("/signup", async (req, res) => {
  const { nome, sobrenome, email, senha } = req.body;

  if (!nome || !sobrenome || !email || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  }

  try {
    // verifica se email já existe
    const { data: existente } = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", email)
      .single();

    if (existente) {
      return res.status(400).json({ error: "E-mail já cadastrado" });
    }

    // gera hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    // insere no banco
    const { data, error } = await supabase
      .from("usuarios")
      .insert([{ nome, sobrenome, email, senha: senhaHash }])
      .select()
      .single();

    if (error) throw error;

    res.json({ message: "Conta criada com sucesso!", usuario: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// rota de login
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: "Informe email e senha" });
  }

  try {
    const { data: user, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }

    // compara senha digitada com o hash
    const senhaOk = await bcrypt.compare(senha, user.senha);
    if (!senhaOk) {
      return res.status(401).json({ error: "Email ou senha inválidos" });
    }

    res.json({ message: "Login OK", usuario: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
