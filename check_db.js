import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oiksafoujlduutkcgays.supabase.co';
const supabaseKey = 'sb_publishable_AB0uoHT_3kBOtwTSoLVf3w_4y_a4uKd';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('id, title, price, compare_price')
    .eq('id', '0e880e4f-2bd4-4f9f-a0f4-1ea7ea9e35f5')
    .single();
    
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Product Data:', data);
  }
}

checkProduct();
