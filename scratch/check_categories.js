import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oiksafoujlduutkcgays.supabase.co';
const supabaseKey = 'sb_publishable_AB0uoHT_3kBOtwTSoLVf3w_4y_a4uKd';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('products').select('id, title, category, category_id');
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(data);
  }
}

main();
