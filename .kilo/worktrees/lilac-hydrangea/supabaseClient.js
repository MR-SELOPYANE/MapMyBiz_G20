import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl="https://baojrbvrciawwqkyflxp.supabase.co"
const supabaseKey="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhb2pyYnZyY2lhd3dxa3lmbHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDc4NjEsImV4cCI6MjA3MTc4Mzg2MX0.h7a0fechNuunOyJH4tckcA6Dc47yoFvAFaS18LvQCiQ"


const supabase = createClient(supabaseUrl, supabaseKey)
export default supabase;