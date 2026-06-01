const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://oiksafoujlduutkcgays.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log("Querying latest email logs from Supabase...");
  
  const { data: logs, error } = await supabase
    .from('email_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error querying email logs:", error.message);
  } else if (logs && logs.length > 0) {
    logs.forEach((log, idx) => {
      console.log(`\n--- Log ${idx + 1} ---`);
      console.log(`Log ID: ${log.id}`);
      console.log(`Order ID: ${log.order_id}`);
      console.log(`Recipient: ${log.recipient_email}`);
      console.log(`Type: ${log.email_type}`);
      console.log(`Status: ${log.delivery_status}`);
      console.log(`Error Message: ${log.error_message}`);
      console.log(`Sent At: ${log.sent_at}`);
    });
  } else {
    console.log("No email logs found.");
  }
}

main();
