import { supabase, supabaseAdmin } from "../lib/database.js"; // Importa o cliente Supabase configurado

export default async function handler(req, res) { 
  // Configura os cabeçalhos CORS para permitir requisições do frontend
  res.setHeader('Access-Control-Allow-Origin', 'https://thadeu-ct.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: email,
      password: senha
    })

    if (signUpError) {
      throw signUpError; // manda erro para o catch
    }

    if (!authData || !authData.user) {
      throw new Error("Falha ao criar usuário no sistema de autenticação (authData nulo).");
    }
    novoUsuarioId = authData.user.id;

    // Insere o novo usuário na tabela "usuarios"
    const { error: insereUsuaioError } = await supabaseAdmin
      .from("usuarios")
      .insert([{ id: novoUsuarioId, nome: nome, sobrenome: sobrenome, email: email }])
    
    if (insereUsuaioError) {
      throw insereUsuaioError; // manda erro para o catch
    }

    const { error: inserePreferenciaError } = await supabaseAdmin
      .from("preferencias")
      .insert({id_usuario: novoUsuarioId})

    if (inserePreferenciaError) {
      throw inserePreferenciaError; // manda erro para o catch
    }

    // pop-up de sucesso
    res.status(201).json({ message: "Conta criada com sucesso!", usuario: authData.user }); 

    // pop-up de erro
  } catch (err) {
    // --- Tratamento de Erros e Rollback ---
    let errorMessage = err.message || "Erro desconhecido no servidor.";
    let errorStatus = err.status || 500;

    // Trata erro de e-mail duplicado vindo do signUp
    if (err.message && err.message.toLowerCase().includes("user already registered")) {
      errorMessage = "Este e-mail já está cadastrado.";
      errorStatus = 400;
    }
    
    // Se um usuário chegou a ser criado no auth, tenta deletá-lo
    if (novoUsuarioId) {
      console.error(`ERRO durante signup após criar auth user ${novoUsuarioId}. Iniciando rollback... Causa: ${err.message}`);
      try {
        // Usamos await aqui para garantir que a deleção seja tentada antes de responder
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(novoUsuarioId);
        if (deleteError) {
            console.error(`ERRO CRÍTICO DURANTE ROLLBACK do usuário ${novoUsuarioId}: ${deleteError.message}`);
        } else {
            console.log(`Rollback: Usuário ${novoUsuarioId} deletado do auth.`);
            // Cascade delete deve cuidar do resto
        }
      } catch (rollbackError) {
        console.error(`EXCEÇÃO CRÍTICA DURANTE ROLLBACK do usuário ${novoUsuarioId}: ${rollbackError.message}`);
      }
    }

    res.status(errorStatus).json({ error: errorMessage });
  }
}