import { createClient } from '@supabase/supabase-js'
import type { User } from 'firebase/auth'
import { auth } from './firebase'

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
      accessToken: async () => {
        return (await auth?.currentUser?.getIdToken(false)) ?? null
      },
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
  : null

export async function sincronizarUsuarioAtual(usuario: User) {
  if (!supabase) {
    throw new Error('O Supabase ainda não foi configurado.')
  }

  // Garante que uma claim adicionada recentemente no Firebase seja renovada
  // antes de o token ser enviado ao Supabase.
  await usuario.getIdToken(true)

  const { error } = await supabase.rpc('registrar_usuario_atual')

  if (error) {
    throw new Error(`Não foi possível registrar o usuário: ${error.message}`)
  }
}
