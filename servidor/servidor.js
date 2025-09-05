// servidor/servidor.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import rotas from "./rotas.js";
import { supabase } from "./database.js";

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

// inicialização do servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
