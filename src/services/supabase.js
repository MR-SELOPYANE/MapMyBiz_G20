import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  "https://baojrbvrciawwqkyflxp.supabase.co";

const SUPABASE_ANON_KEY =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhb2pyYnZyY2lhd3dxa3lmbHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDc4NjEsImV4cCI6MjA3MTc4Mzg2MX0.h7a0fechNuunOyJH4tckcA6Dc47yoFvAFaS18LvQCiQ";

export function createSupabaseClient(url = SUPABASE_URL, key = SUPABASE_ANON_KEY) {
  return createClient(url, key);
}

const supabase = createSupabaseClient();

export default supabase;
