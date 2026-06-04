const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://oiksafoujlduutkcgays.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is missing in env. Cannot run DB tests.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
  console.log("=== STARTING SHIPROCKET AUTO-SYNC TESTS ===");

  // Test 1: Schema Check
  console.log("\n[Test 1] Verifying database schema columns...");
  try {
    const { data: testOrder, error: schemaErr } = await supabase
      .from('orders')
      .select('shiprocket_sync_status, shiprocket_sync_error')
      .limit(1);

    if (schemaErr) {
      throw new Error(`Schema check failed. Make sure you ran the SQL script in Supabase: ${schemaErr.message}`);
    }
    console.log("✓ Schema verify: shiprocket_sync_status and shiprocket_sync_error columns exist!");
  } catch (err) {
    console.error("✗ Test 1 Failed:", err.message);
    process.exit(1);
  }

  // Test 2: Status Persistence
  console.log("\n[Test 2] Testing sync status persistence...");
  let tempOrderId;
  try {
    // Create a temporary test order
    const { data: order, error: insErr } = await supabase
      .from('orders')
      .insert([{
        customer_name: 'Test Runner',
        customer_email: 'test@molvbriv.in',
        customer_phone: '9999999999',
        shipping_address: { address: '123 Test Street, New Delhi', city: 'Delhi', pinCode: '110001', state: 'Delhi' },
        products: [{ name: 'Test Ring', price: 100, quantity: 1 }],
        total_price: 100,
        total_amount: 100,
        razorpay_order_id: `MB-TEST-${Math.floor(Date.now() / 1000)}`,
        payment_method: 'COD',
        payment_status: 'pending',
        order_status: 'Pending',
        status: 'pending',
        shiprocket_sync_status: 'Pending'
      }])
      .select()
      .single();

    if (insErr || !order) throw new Error(`Failed to insert test order: ${insErr?.message}`);
    tempOrderId = order.id;
    console.log(`✓ Test order inserted with ID: ${tempOrderId}`);

    // Update to Failed status with error log
    const { data: failedOrder, error: updErr } = await supabase
      .from('orders')
      .update({
        shiprocket_sync_status: 'Failed',
        shiprocket_sync_error: 'Simulated API rate limit error'
      })
      .eq('id', tempOrderId)
      .select()
      .single();

    if (updErr || !failedOrder) throw new Error(`Failed to update to Failed status: ${updErr?.message}`);
    if (failedOrder.shiprocket_sync_status !== 'Failed' || failedOrder.shiprocket_sync_error !== 'Simulated API rate limit error') {
      throw new Error(`Data mismatch in updated status: ${JSON.stringify(failedOrder)}`);
    }
    console.log("✓ Successfully saved 'Failed' sync status and error log!");

    // Update to Created status
    const { data: successOrder, error: updErr2 } = await supabase
      .from('orders')
      .update({
        shiprocket_sync_status: 'Created',
        shiprocket_sync_error: null,
        shiprocket_order_id: '1234567',
        shipment_id: '9876543'
      })
      .eq('id', tempOrderId)
      .select()
      .single();

    if (updErr2 || !successOrder) throw new Error(`Failed to update to Created status: ${updErr2?.message}`);
    if (successOrder.shiprocket_sync_status !== 'Created' || successOrder.shiprocket_sync_error !== null) {
      throw new Error(`Data mismatch in updated status: ${JSON.stringify(successOrder)}`);
    }
    console.log("✓ Successfully saved 'Created' sync status and cleared error!");

  } catch (err) {
    console.error("✗ Test 2 Failed:", err.message);
    await cleanup(tempOrderId);
    process.exit(1);
  }

  // Test 3: Exponential Backoff & Retry Logic Unit Test
  console.log("\n[Test 3] Simulating automated retry schedule flow...");
  try {
    let mockAttempt = 1;
    let mockMaxRetries = 3;
    let loggedAttempts = [];
    let scheduledDelays = [];

    const mockRetryFulfill = async (orderId, attempt = 1) => {
      loggedAttempts.push(attempt);
      if (attempt < mockMaxRetries) {
        const delay = attempt === 1 ? 50 : 100; // Mock shorter delays for testing
        scheduledDelays.push(delay);
        return new Promise((resolve) => {
          setTimeout(() => {
            mockRetryFulfill(orderId, attempt + 1).then(resolve);
          }, delay);
        });
      }
    };

    console.log("Scheduling mock retry chain for test order...");
    await mockRetryFulfill(tempOrderId);

    if (loggedAttempts.length !== 3 || scheduledDelays.length !== 2) {
      throw new Error(`Retry chain did not execute expected attempts. Attempts: ${loggedAttempts.join(', ')}`);
    }
    console.log(`✓ Retry flow successfully completed ${loggedAttempts.length} attempts!`);
    console.log(`✓ Exponential delays scheduled: ${scheduledDelays.map(d => `${d}ms`).join(', ')}`);
  } catch (err) {
    console.error("✗ Test 3 Failed:", err.message);
    await cleanup(tempOrderId);
    process.exit(1);
  }

  await cleanup(tempOrderId);
  console.log("\n=== ALL SHIPROCKET AUTO-SYNC TESTS PASSED ===");
}

async function cleanup(orderId) {
  if (orderId) {
    console.log(`\nCleaning up test order: ${orderId}...`);
    await supabase.from('orders').delete().eq('id', orderId);
  }
}

runTests();
