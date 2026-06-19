import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check .env.local file.')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Global memory cache variables
let cachedProducts = null
let cachedProductsPromise = null
let cachedRatingsMap = null
let cachedRatingsPromise = null

/**
 * Fetches products list from Supabase and caches them in memory.
 * Future calls resolve instantly from cache.
 * @param {boolean} forceRefresh Force refetching from DB
 */
export async function getCachedProducts(forceRefresh = false) {
  if (cachedProducts && !forceRefresh) {
    return cachedProducts
  }
  if (cachedProductsPromise && !forceRefresh) {
    return cachedProductsPromise
  }
  cachedProductsPromise = (async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (error) {
      cachedProductsPromise = null
      throw error
    }
    cachedProducts = data || []
    return cachedProducts
  })()
  return cachedProductsPromise
}

/**
 * Fetches all approved reviews rating counts from Supabase and caches them in memory.
 * Future calls resolve instantly from cache.
 * @param {boolean} forceRefresh Force refetching from DB
 */
export async function getCachedRatingsMap(forceRefresh = false) {
  if (cachedRatingsMap && !forceRefresh) {
    return cachedRatingsMap
  }
  if (cachedRatingsPromise && !forceRefresh) {
    return cachedRatingsPromise
  }
  cachedRatingsPromise = (async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('product_id, rating')
      .eq('status', 'approved')
      
    if (error) {
      cachedRatingsPromise = null
      throw error
    }
    
    const lookup = {}
    if (data) {
      data.forEach(r => {
        if (!lookup[r.product_id]) {
          lookup[r.product_id] = { sum: 0, count: 0 }
        }
        lookup[r.product_id].sum += r.rating
        lookup[r.product_id].count += 1
      })
    }
    cachedRatingsMap = lookup
    return lookup
  })()
  return cachedRatingsPromise
}

/**
 * Clears the frontend data cache.
 */
export function clearFrontendCache() {
  cachedProducts = null
  cachedProductsPromise = null
  cachedRatingsMap = null
  cachedRatingsPromise = null
}

