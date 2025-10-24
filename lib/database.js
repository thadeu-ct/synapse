// servidor/database.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env para o ambiente do Node.js
dotenv.config();

// Agora, em vez de ler as chaves diretamente, lemos do ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_USUARIO_KEY = process.env.SUPABASE_KEY;
const SUPABASE_PREFERENCIAS_KEY = process.env.SUPABASE_SERVICE_KEY;

// Validação para garantir que as chaves foram carregadas
if (!SUPABASE_URL || !SUPABASE_USUARIO_KEY || !SUPABASE_PREFERENCIAS_KEY) {
    console.error("Erro: As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY e SUPABASE_PREFERENCIAS_KEY não foram encontradas.");
    process.exit(1);
}

// Cria e exporta o cliente Supabase para ser usado em outros arquivos
export const supabase = createClient(SUPABASE_URL, SUPABASE_USUARIO_KEY);

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_PREFERENCIAS_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});