import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oiksafoujlduutkcgays.supabase.co';
const supabaseKey = 'sb_publishable_AB0uoHT_3kBOtwTSoLVf3w_4y_a4uKd';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, description, material, category_id, tags');
    
  if (error) {
    console.error('Error fetching products:', error.message);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
