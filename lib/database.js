// servidor/database.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env para o ambiente do Node.js
dotenv.config();

// Agora, em vez de ler as chaves diretamente, lemos do ambiente
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Validação para garantir que as chaves foram carregadas
if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Erro: As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY não foram encontradas.");
    // Em um cenário real, você poderia querer que o programa parasse aqui
    // process.exit(1);
}

// Cria e exporta o cliente Supabase para ser usado em outros arquivos
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);