import { supabase } from './database.js'

// Testa a conexão listando os usuários
async function main() {
  const { data, error } = await supabase.from('usuarios').select('*')
  if (error) {
    console.error("Erro:", error)
  } else {
    console.log("Usuários:", data)
  }
}

main()
