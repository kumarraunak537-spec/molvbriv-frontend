const fs = require('fs');
const path = require('path');

const envPath = path.resolve('backend/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL || 'https://oiksafoujlduutkcgays.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const backendNodeModules = path.resolve('backend/node_modules');
const supabasePath = path.join(backendNodeModules, '@supabase', 'supabase-js');
const { createClient: createSupabaseClient } = require(supabasePath);

const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

async function main() {
  const fields = ['id', 'user_id', 'product_id', 'rating', 'comment', 'created_at', 'title', 'customer_name', 'status', 'is_verified'];
  for (let field of fields) {
    const { data, error } = await supabase.from('reviews').select(field).limit(1);
    if (error) {
      console.log(`Field '${field}': NOT EXISTS (${error.message})`);
    } else {
      console.log(`Field '${field}': EXISTS`);
    }
  }
}

main();
