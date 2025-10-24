import bcrypt from "bcryptjs"; // Biblioteca para hashing de senhas
import { supabase, supabaseAdmin } from "../lib/database.js"; // Importa o cliente Supabase configurado

export default async function handler(req, res) { 
  // Configura os cabeçalhos CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  } // backend respode as regras
  if (req.method !== "POST") {
    return res.status(405).end(`Método ${req.method} não permitido`);
  } // backend só aceita dados

  // Extrai os dados do corpo da requisição
  const { nome, sobrenome, email, senha } = req.body;
  if (!nome || !sobrenome || !email || !senha) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }
  if (senha.length < 6) { // Validação de senha tamanho mínimo
    return res.status(400).json({ error: "A senha deve ter no mínimo 6 caracteres" });
  }

  let novoUsuarioId = null;

  try { // Verifica se o e-mail já está cadastrado
    // sistema para criptografia de senha
    const fatorSecreto = 15;
    const senhaHash = await bcrypt.hash(senha, fatorSecreto);

    // Insere o novo usuário na tabela "usuarios"
    const { data: novoUsuario, error: insereUsuaioError } = await supabase 
      .from("usuarios")
      .insert([{ nome, sobrenome, email, senha_hash: senhaHash }])
      .select("id, nome, sobrenome, email, created_at")
      .single();
    
    if (insereUsuaioError) {
      throw insereUsuaioError; // manda erro para o catch
    }

    novoUsuarioId = novoUsuario.id;

    const { error: inserePreferenciaError } = await supabaseAdmin
      .from("preferencias")
      .insert({id_usuario: novoUsuarioId})

    if (inserePreferenciaError) {
      throw inserePreferenciaError; // manda erro para o catch
    }

    // pop-up de sucesso
    res.status(201).json({ message: "Conta criada com sucesso!", usuario: novoUsuario }); 

    // pop-up de erro
  } catch (err) {
    if (err.code === '23505') {
        return res.status(400).json({ error: "Este e-mail já está cadastrado." });
    }
    
    if (novoUsuarioId) {
      console.error(`Erro ao concluir a conta para ${novoUsuarioId}. Iniciando rollback...`);
      await supabaseAdmin.auth.admin.deleteUser(novoUsuarioId);
      console.log(`Rollback concluído: Usuário ${novoUsuarioId} deletado.`);
    }

    res.status(500).json({ error: `Erro no servidor: ${err.message}` });
  }
}