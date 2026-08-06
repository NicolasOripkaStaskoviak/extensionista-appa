import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  ?.trim()
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '')
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

function valorValido(valor: string | undefined) {
  return Boolean(
    valor &&
      !valor.includes('TESTE') &&
      !valor.includes('SUBSTITUA') &&
      !valor.includes('SEU_'),
  )
}

export const supabaseConfigurado =
  valorValido(supabaseUrl) && valorValido(supabasePublishableKey)

export const supabase = supabaseConfigurado
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storage: window.sessionStorage,
      },
    })
  : null
