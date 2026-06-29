const fs = require('fs');
const path = require('path');

// Manually parse env
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
  // We can run a query to information_schema.columns using rpc or check if there is an RPC we can use.
  // Wait, Supabase client doesn't let you run arbitrary SQL directly unless you have an RPC function.
  // But we can check if inserting a mock review works, or see what columns are in reviews by doing:
  // We can try to select '*' and see if that succeeds. In our previous run, select('*') succeeded and returned:
  // "Sample review row: No reviews found" (which means the query succeeded, but returned an empty array because there are no rows).
  // If the columns didn't exist in the database, select('*') would still succeed (since it selects all existing columns), 
  // but selecting a specific column that doesn't exist (like select('customer_name')) fails with code 42703!
  // This proves that 'customer_name' column does NOT exist in the database!
  
  // Let's try to query table info by checking the API or running select('*') on a non-existent table to see if it errors.
  // No, we know for a fact that select('customer_name') failed with "column reviews.customer_name does not exist".
  // Let's test which columns actually exist in public.reviews.
  // We can do this by trying to insert a row with only 'user_id' and 'rating' and 'comment', and see if it succeeds.
  // Wait, let's see what happens if we select other fields like 'title', 'status', 'is_verified'.
  const fields = ['id', 'title', 'price', 'category', 'metal_weight', 'est_metal_weight', 'weight', 'description'];
  for (let field of fields) {
    const { data, error } = await supabase.from('products').select(field).limit(1);
    if (error) {
      console.log(`Field '${field}': NOT EXISTS (${error.message})`);
    } else {
      console.log(`Field '${field}': EXISTS`);
    }
  }
}

main();
