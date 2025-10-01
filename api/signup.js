// api/signup.js
import bcrypt from "bcrypt";
import { supabase } from "../servidor/database.js";

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

  // --- Lógica do Signup ---
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
}