// Importér Supabase-klienten fra det officielle JavaScript SDK
import { createClient } from "@supabase/supabase-js";

// Hent Supabase URL fra miljøvariablerne (defineret i .env.local)
// '!' fortæller TypeScript at værdien ikke vil være undefined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Hent Supabase anon key fra miljøvariablerne
// Dette er den offentlige API-nøgle der bruges til klient-side requests
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

// Opret og eksportér Supabase-klienten som kan bruges i hele applikationen
// Denne klient håndterer alle database-operationer, autentificering og storage
export const supabase = createClient(supabaseUrl, supabaseKey);
