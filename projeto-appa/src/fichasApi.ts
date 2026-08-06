import { supabase, supabaseConfigurado } from './supabase'
import type { FichaPayload } from './salvarFicha'

export interface AnimalResumo {
  nome: string | null
  especie: string | null
  raca: string | null
}

export interface FichaResumo {
  id: string
  animal_de_rua: boolean
  responsavel_nome: string | null
  criado_por_email: string | null
  observacoes: string | null
  data_castracao: string | null
  criado_em: string
  atualizado_em: string
  animais: AnimalResumo[]
}

export interface FichaCompleta extends FichaPayload {
  id: string
  criado_em: string
  atualizado_em: string
}

function cliente() {
  if (!supabase || !supabaseConfigurado) {
    throw new Error('O Supabase ainda não foi configurado neste ambiente.')
  }
  return supabase
}

export async function listarFichas() {
  const { data, error } = await cliente().rpc('listar_fichas')
  if (error) {
    console.error('Erro ao listar fichas:', error)
    throw new Error(
      'Não foi possível carregar as fichas. Execute a migration de gerenciamento no Supabase.',
    )
  }
  return (data ?? []) as FichaResumo[]
}

export async function obterFicha(fichaId: string) {
  const { data, error } = await cliente().rpc('obter_ficha', {
    p_ficha_id: fichaId,
  })
  if (error) {
    console.error('Erro ao obter ficha:', error)
    throw new Error('Não foi possível abrir esta ficha.')
  }
  if (!data) throw new Error('Ficha não encontrada.')
  return data as FichaCompleta
}

export async function atualizarFicha(
  fichaId: string,
  payload: FichaPayload,
) {
  const { data, error } = await cliente().rpc('atualizar_ficha', {
    p_ficha_id: fichaId,
    p_dados: payload,
  })
  if (error) {
    console.error('Erro ao atualizar ficha:', error)
    throw new Error('Não foi possível atualizar a ficha.')
  }
  return data as { ficha_id: string; usuario_id: string }
}

export async function excluirFicha(fichaId: string) {
  const { error } = await cliente().rpc('excluir_ficha', {
    p_ficha_id: fichaId,
  })
  if (error) {
    console.error('Erro ao excluir ficha:', error)
    throw new Error('Não foi possível excluir a ficha.')
  }
}
