import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency = "INR", receipt } = await req.json()

    // 1. Validate the user via Supabase Auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error("Unauthorized access")
    }

    // 2. Call Razorpay API to create an order
    const rzpKey = Deno.env.get('RAZORPAY_KEY_ID')
    const rzpSecret = Deno.env.get('RAZORPAY_KEY_SECRET')

    if (!rzpKey || !rzpSecret) {
      throw new Error("Razorpay credentials are not configured in environment variables")
    }

    const authHeader = "Basic " + btoa(`${rzpKey}:${rzpSecret}`)

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader
      },
      body: JSON.stringify({
        amount: amount * 100, // Amount in paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
      })
    })

    const orderData = await response.json()

    if (!response.ok) {
      throw new Error(orderData.error.description || "Razorpay API error")
    }

    // 3. Return the Order ID to the frontend to trigger the checkout modal
    return new Response(
      JSON.stringify(orderData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    )
  }
})
