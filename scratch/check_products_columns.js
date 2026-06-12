import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oiksafoujlduutkcgays.supabase.co';
const supabaseKey = 'sb_publishable_AB0uoHT_3kBOtwTSoLVf3w_4y_a4uKd';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const fields = ['id', 'title', 'price', 'compare_price', 'category', 'category_id', 'material', 'stock', 'description', 'status', 'colors', 'tags', 'sku'];
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
