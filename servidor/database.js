// servidor/database.js
import { createClient } from '@supabase/supabase-js'

// Essas infos você pega no painel do Supabase (project settings → API)
const SUPABASE_URL = "https://mfqktsawbldigufhgrsl.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mcWt0c2F3YmxkaWd1ZmhncnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Mjg3NDAsImV4cCI6MjA3MjUwNDc0MH0.3E9PRBWwg-VGubxpolmqttii_DNugyevLmDlKcU8js0" // não é a service_role, é a anon key

// Cria o cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Função para cadastrar usuário
export async function cadastrarUsuario({ nome, sobrenome, email, senha }) {
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nome, sobrenome, email, senha }])

  if (error) {
    console.error("Erro ao cadastrar:", error.message)
    return null
  }

  return data
}
