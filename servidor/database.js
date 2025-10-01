// servidor/database.js
import { createClient } from '@supabase/supabase-js';

// Suas chaves de API do Supabase. Mantenha-as seguras.
// A SUPABASE_KEY é a chave anônima (anon key), não a service_role.
const SUPABASE_URL = "https://mfqktsawbldigufhgrsl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mcWt0c2F3YmxkaWd1ZmhncnNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Mjg3NDAsImV4cCI6MjA3MjUwNDc0MH0.3E9PRBWwg-VGubxpolmqttii_DNugyevLmDlKcU8js0";

// Cria e exporta o cliente Supabase para ser usado em outros arquivos
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
