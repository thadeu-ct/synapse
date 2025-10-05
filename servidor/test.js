import { supabase } from './database.js';
import bcrypt from "bcrypt";

// Testa a conexão listando os usuários
async function main() {
  const { data, error } = await supabase.from('usuarios').select('*')
  if (error) {
    console.error("Erro:", error)
  } else {
    console.log("Usuários:", data)
  }
}

async function testSenha() {
  const senha = "minhaSenha123";
  const hash = await bcrypt.hash(senha, 10);

  console.log("Senha original:", senha);
  console.log("Hash gerado:", hash);

  const confere = await bcrypt.compare("minhaSenha123", hash);
  console.log("Senha confere?", confere);
}

async function criarAdmin() {
  try {
    const nome = "Admin";
    const sobrenome = "Master";
    const email = "admin@nexos.com";
    const senha = "123456";

    // Gera o hash da senha
    const hash = await bcrypt.hash(senha, 10);

    // Insere no banco via Supabase
    const { error } = await supabase
      .from("usuarios")
      .insert([
        { nome, sobrenome, email, senha: hash }
      ]);

    if (error) {
      console.error("Erro ao criar admin:", error.message);
    } else {
      console.log("✅ Conta admin criada com sucesso!");
    }
  } catch (err) {
    console.error("Erro inesperado:", err);
  }
}

main()
testSenha();
// criarAdmin();