const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://oiksafoujlduutkcgays.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Querying order details...");
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('razorpay_order_id', 'MB-COD-1780601954')
    .single();

  if (error) {
    console.error("Error querying order:", error.message);
  } else {
    console.log("Order Data:", JSON.stringify(order, null, 2));
  }
}

main();
