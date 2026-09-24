import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_SERVICE_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhb2pyYnZyY2lhd3dxa3lmbHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMDc4NjEsImV4cCI6MjA3MTc4Mzg2MX0.h7a0fechNuunOyJH4tckcA6Dc47yoFvAFaS18LvQCiQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Get list of all tables in 'public' schema
async function getAllTableNames() {
  const { data, error } = await supabase
    .rpc('get_tables_in_schema', { schema_name: 'public' })

  if (error) throw error
  return data
}

// Fetch all data from a table
async function extractTableData(tableName) {
  console.log(`Extracting data from: ${tableName}...`)
  const { data, error } = await supabase
    .from(tableName)
    .select('*')

  if (error) {
    console.error(`Error extracting ${tableName}:`, error.message)
    return null
  }

  return data
}

// Save data to JSON file
function saveToFile(tableName, data) {
  const filename = `${tableName}.json`
  fs.writeFileSync(filename, JSON.stringify(data, null, 2))
  console.log(`✅ Saved ${data.length} records to ${filename}`)
}

// Main function
async function extractAllTables() {
  try {
    const tables = await getAllTableNames()
    console.log(`Found ${tables.length} tables:`, tables)

    for (const table of tables) {
      const data = await extractTableData(table)
      if (data) {
        saveToFile(table, data)
      }
    }

    console.log('🎉 All tables extracted successfully!')
  } catch (error) {
    console.error(' Extraction failed:', error.message)
  }
}

// Run it
extractAllTables()