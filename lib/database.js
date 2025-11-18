// servidor/database.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env para o ambiente do Node.js
dotenv.config();

// Agora, em vez de ler as chaves diretamente, lemos do ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_USUARIO_KEY = process.env.SUPABASE_USUARIO_KEY;
const SUPABASE_PREFERENCIAS_KEY = process.env.SUPABASE_PREFERENCIAS_KEY;

// Validação para garantir que as chaves foram carregadas
if (!SUPABASE_URL || !SUPABASE_USUARIO_KEY || !SUPABASE_PREFERENCIAS_KEY) {
    console.error("ERRO FATAL: Variáveis SUPABASE_URL, SUPABASE_USUARIO_KEY (anon) e SUPABASE_PREFERENCIAS_KEY (service) são obrigatórias.");
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