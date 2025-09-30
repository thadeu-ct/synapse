import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import { supabase } from "./database.js";

const app = express();
const PORT = 3000;

// Middlewares: preparam o servidor para receber requisições
app.use(cors()); // Permite que o frontend (em outra porta) acesse o backend
app.use(bodyParser.json()); // Permite que o servidor entenda JSON no corpo das requisições

// Rota inicial para testar se o servidor está online
app.get("/", (req, res) => {
  res.send("🚀 Servidor online e pronto para receber requisições!");
});

// ----------------- ROTAS DE AUTENTICAÇÃO ----------------- //

// Rota de CADASTRO (signup)
app.post("/signup", async (req, res) => {
  // 1. Pega os dados enviados pelo frontend
  const { nome, sobrenome, email, senha } = req.body;

  // 2. Validação básica
  if (!nome || !sobrenome || !email || !senha) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }
  if (senha.length < 6) {
    return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" });
  }

  try {
    // 3. Verifica se o e-mail já existe no banco de dados
    const { data: usuarioExistente, error: selectError } = await supabase
      .from("usuarios")
      .select("id")
      .eq("email", email)
      .single();

    if (usuarioExistente) {
      return res.status(400).json({ error: "Este e-mail já está cadastrado" });
    }

    // 4. Criptografa a senha antes de salvar (segurança!)
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    // 5. Insere o novo usuário no banco de dados
    const { data: novoUsuario, error: insertError } = await supabase
      .from("usuarios")
      .insert([{ nome, sobrenome, email, senha: senhaHash }])
      .select("id, nome, sobrenome, email, created_at") // Retorna os dados seguros
      .single();

    if (insertError) {
      throw insertError; // Joga o erro para o catch
    }

    // 6. Envia uma resposta de sucesso para o frontend
    res.status(201).json({ message: "Conta criada com sucesso!", usuario: novoUsuario });

  } catch (err) {
    // Em caso de qualquer erro no processo, envia uma resposta de erro
    res.status(500).json({ error: `Erro no servidor: ${err.message}` });
  }
});


// Rota de LOGIN
app.post("/login", async (req, res) => {
    // 1. Pega email e senha do corpo da requisição
    const { email, senha } = req.body;

    // 2. Validação
    if (!email || !senha) {
        return res.status(400).json({ error: "Informe e-mail e senha" });
    }

    try {
        // 3. Busca o usuário pelo email no banco
        const { data: usuario, error: selectError } = await supabase
            .from("usuarios")
            .select("*")
            .eq("email", email)
            .single();

        // Se não encontrou o usuário, o erro é o mesmo de senha errada (segurança)
        if (selectError || !usuario) {
            return res.status(401).json({ error: "E-mail ou senha inválidos" });
        }

        // 4. Compara a senha enviada com a senha criptografada no banco
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ error: "E-mail ou senha inválidos" });
        }
        
        // 5. Login bem-sucedido. Retorna uma mensagem e os dados do usuário (sem a senha)
        delete usuario.senha; // Remove a senha do objeto antes de enviar
        res.status(200).json({ message: "Login realizado com sucesso!", usuario: usuario });

    } catch (err) {
        res.status(500).json({ error: `Erro no servidor: ${err.message}` });
    }
});


// --------------------------------------------------------- //

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
