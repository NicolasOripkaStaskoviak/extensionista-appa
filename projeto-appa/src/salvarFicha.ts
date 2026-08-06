import type { User } from '@supabase/supabase-js'
import { supabase, supabaseConfigurado } from './supabase'

export interface MoradorPayload {
  nome: string | null
  idade: string | null
  renda: string | null
}

export interface AnimalPayload {
  nome: string | null
  especie: string | null
  raca: string | null
  idade: string | null
  vacinado: boolean | null
  peso: string | null
  ultimo_cio: string | null
}

export interface ResponsavelPayload {
  nome: string | null
  profissao: string | null
  rg: string | null
  cpf: string | null
  nis: string | null
  endereco: string | null
  telefone: string | null
  residencia: string | null
  possui_veiculo: boolean | null
  veiculo_descricao: string | null
  veiculo_financiado: boolean
  renda_familiar: string | null
  quantidade_moradores: string | null
  quantidade_dependentes: string | null
}

export interface FichaPayload {
  usuario: {
    email: string | null
    nome: string | null
  }
  animal_de_rua: boolean
  responsavel: ResponsavelPayload | null
  moradores: MoradorPayload[]
  animais: AnimalPayload[]
  observacoes: string | null
  data_castracao: string | null
}

interface ResultadoRpc {
  ficha_id: string
  usuario_id: string
}

export class ErroAoSalvarFicha extends Error {}

function nomeSeguro(nome: string) {
  const partes = nome.split('.')
  const extensao = partes.length > 1 ? `.${partes.pop()}` : ''
  const base = partes
    .join('.')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

  return `${base || 'imagem'}${extensao.toLowerCase()}`
}

async function enviarImagem(
  arquivo: File,
  usuario: User,
  fichaId: string,
  usuarioId: string,
) {
  if (!supabase) return

  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp']

  if (!tiposPermitidos.includes(arquivo.type)) {
    throw new Error(`${arquivo.name}: formato não aceito`)
  }

  if (arquivo.size > 10 * 1024 * 1024) {
    throw new Error(`${arquivo.name}: arquivo maior que 10 MB`)
  }

  const caminho = `${usuario.id}/${fichaId}/${crypto.randomUUID()}-${nomeSeguro(arquivo.name)}`
  const { error: erroUpload } = await supabase.storage
    .from('animais')
    .upload(caminho, arquivo, {
      cacheControl: '3600',
      contentType: arquivo.type,
      upsert: false,
    })

  if (erroUpload) throw erroUpload

  const { error: erroMetadados } = await supabase.from('animal_fotos').insert({
    ficha_id: fichaId,
    animal_id: null,
    storage_path: caminho,
    nome_original: arquivo.name,
    mime_type: arquivo.type,
    tamanho_bytes: arquivo.size,
    enviado_por: usuarioId,
  })

  if (erroMetadados) {
    await supabase.storage.from('animais').remove([caminho])
    throw erroMetadados
  }
}

export async function enviarImagensDaFicha(
  imagens: File[],
  usuario: User,
  fichaId: string,
  usuarioId: string,
) {
  const falhas: string[] = []
  for (const imagem of imagens) {
    try {
      await enviarImagem(imagem, usuario, fichaId, usuarioId)
    } catch (erro) {
      console.error('Erro ao enviar imagem:', erro)
      falhas.push(imagem.name)
    }
  }
  return falhas
}

export async function salvarFicha(
  payload: FichaPayload,
  imagens: File[],
  usuario: User,
) {
  if (!supabase || !supabaseConfigurado) {
    throw new ErroAoSalvarFicha(
      'O Supabase ainda não foi configurado neste ambiente.',
    )
  }

  const { data, error } = await supabase.rpc('salvar_ficha', {
    p_dados: payload,
  })

  if (error) {
    console.error('Erro ao salvar ficha no Supabase:', error)
    throw new ErroAoSalvarFicha(
      'O banco recusou o salvamento. Confira se as migrations foram executadas.',
    )
  }

  const resultado = data as ResultadoRpc | null
  if (!resultado?.ficha_id || !resultado.usuario_id) {
    throw new ErroAoSalvarFicha('O banco retornou uma resposta inválida.')
  }

  const falhasImagens = await enviarImagensDaFicha(
    imagens,
    usuario,
    resultado.ficha_id,
    resultado.usuario_id,
  )

  return {
    fichaId: resultado.ficha_id,
    ficha_id: resultado.ficha_id,
    usuario_id: resultado.usuario_id,
    imagensEnviadas: imagens.length - falhasImagens.length,
    falhasImagens,
  }
}
