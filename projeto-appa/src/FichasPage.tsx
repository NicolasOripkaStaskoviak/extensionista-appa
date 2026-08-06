import { useEffect, useMemo, useState } from 'react'
import {
  excluirFicha,
  listarFichas,
  obterFicha,
} from './fichasApi'
import type { FichaCompleta, FichaResumo } from './fichasApi'

interface Props {
  onNovaFicha: () => void
  onEditar: (ficha: FichaCompleta) => void
}

function formatarData(data: string | null | undefined) {
  if (!data) return 'Não informada'
  const valor = /^\d{4}-\d{2}-\d{2}$/.test(data)
    ? new Date(`${data}T12:00:00`)
    : new Date(data)
  return Number.isNaN(valor.getTime())
    ? 'Não informada'
    : new Intl.DateTimeFormat('pt-BR').format(valor)
}

function nomePeloEmail(email: string | null) {
  const nome = email?.split('@')[0]?.trim()
  return nome || 'Não identificado'
}

function normalizar(valor: string | null | undefined) {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
}

export default function FichasPage({ onNovaFicha, onEditar }: Props) {
  const [fichas, setFichas] = useState<FichaResumo[]>([])
  const [selecionada, setSelecionada] = useState<FichaCompleta | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [excluindo, setExcluindo] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [tipo, setTipo] = useState('todos')
  const [especie, setEspecie] = useState('todas')
  const [castracao, setCastracao] = useState('todas')
  const [cadastroInicial, setCadastroInicial] = useState('')
  const [cadastroFinal, setCadastroFinal] = useState('')
  const [ordenacao, setOrdenacao] = useState('recentes')

  const filtrosAtivos = [
    busca,
    tipo !== 'todos' ? tipo : '',
    especie !== 'todas' ? especie : '',
    castracao !== 'todas' ? castracao : '',
    cadastroInicial,
    cadastroFinal,
  ].filter(Boolean).length

  const fichasFiltradas = useMemo(() => {
    const termo = normalizar(busca)
    const hoje = new Date().toISOString().slice(0, 10)
    const resultado = fichas.filter((ficha) => {
      const textoPesquisavel = normalizar([
        ficha.responsavel_nome,
        ficha.criado_por_email,
        ficha.observacoes,
        ...ficha.animais.flatMap((animal) => [animal.nome, animal.especie, animal.raca]),
      ].filter(Boolean).join(' '))
      const correspondeBusca = !termo || textoPesquisavel.includes(termo)
      const correspondeTipo = tipo === 'todos'
        || (tipo === 'rua' ? ficha.animal_de_rua : !ficha.animal_de_rua)
      const correspondeEspecie = especie === 'todas'
        || ficha.animais.some((animal) => normalizar(animal.especie) === especie)
      const dataCastracao = ficha.data_castracao ?? ''
      const correspondeCastracao = castracao === 'todas'
        || (castracao === 'sem-data' && !dataCastracao)
        || (castracao === 'com-data' && Boolean(dataCastracao))
        || (castracao === 'agendada' && dataCastracao >= hoje)
        || (castracao === 'passada' && Boolean(dataCastracao) && dataCastracao < hoje)
      const dataCadastro = ficha.criado_em.slice(0, 10)
      const correspondeInicio = !cadastroInicial || dataCadastro >= cadastroInicial
      const correspondeFim = !cadastroFinal || dataCadastro <= cadastroFinal
      return correspondeBusca && correspondeTipo && correspondeEspecie
        && correspondeCastracao && correspondeInicio && correspondeFim
    })

    return resultado.sort((a, b) => {
      if (ordenacao === 'antigas') return a.criado_em.localeCompare(b.criado_em)
      if (ordenacao === 'nome') {
        const nomeA = a.responsavel_nome || a.animais[0]?.nome || ''
        const nomeB = b.responsavel_nome || b.animais[0]?.nome || ''
        return nomeA.localeCompare(nomeB, 'pt-BR')
      }
      if (ordenacao === 'castracao') {
        return (a.data_castracao || '9999-12-31').localeCompare(b.data_castracao || '9999-12-31')
      }
      return b.criado_em.localeCompare(a.criado_em)
    })
  }, [busca, cadastroFinal, cadastroInicial, castracao, especie, fichas, ordenacao, tipo])

  function limparFiltros() {
    setBusca('')
    setTipo('todos')
    setEspecie('todas')
    setCastracao('todas')
    setCadastroInicial('')
    setCadastroFinal('')
    setOrdenacao('recentes')
  }

  async function carregar() {
    setCarregando(true)
    setErro('')
    try {
      setFichas(await listarFichas())
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível carregar as fichas.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    void carregar()
  }, [])

  async function visualizar(fichaId: string) {
    setErro('')
    try {
      setSelecionada(await obterFicha(fichaId))
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível abrir a ficha.')
    }
  }

  async function editar(fichaId: string) {
    setErro('')
    try {
      onEditar(await obterFicha(fichaId))
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível abrir a ficha para edição.')
    }
  }

  async function remover(ficha: FichaResumo) {
    const referencia = ficha.responsavel_nome || ficha.animais[0]?.nome || 'esta ficha'
    if (!window.confirm(`Excluir ${referencia}? Esta ação removerá a ficha da listagem.`)) return

    setExcluindo(ficha.id)
    setErro('')
    try {
      await excluirFicha(ficha.id)
      setFichas((atuais) => atuais.filter((item) => item.id !== ficha.id))
      if (selecionada?.id === ficha.id) setSelecionada(null)
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível excluir a ficha.')
    } finally {
      setExcluindo(null)
    }
  }

  return (
    <section className="fichas-container" aria-labelledby="titulo-fichas">
      <header className="cabecalho-pagina cabecalho-fichas">
        <div>
          <span className="sobretitulo">Projeto Castração</span>
          <h1 id="titulo-fichas">Todas as fichas</h1>
          <p>Consulte, edite ou exclua os cadastros já preenchidos.</p>
        </div>
        <button type="button" onClick={onNovaFicha}>Nova ficha</button>
      </header>

      {erro && <p className="mensagem mensagem-erro" role="alert">{erro}</p>}

      {!carregando && fichas.length > 0 && (
        <section className="painel-pesquisa" aria-label="Pesquisa e filtros de fichas">
          <div className="barra-pesquisa">
            <div className="campo campo-pesquisa">
              <label htmlFor="pesquisar-fichas">Pesquisar fichas</label>
              <div className="entrada-pesquisa">
                <span aria-hidden="true">⌕</span>
                <input
                  id="pesquisar-fichas"
                  type="search"
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Responsável, animal, raça, autor ou observação"
                />
              </div>
            </div>
            <div className="campo campo-ordenacao">
              <label htmlFor="ordenar-fichas">Ordenar por</label>
              <select id="ordenar-fichas" value={ordenacao} onChange={(evento) => setOrdenacao(evento.target.value)}>
                <option value="recentes">Mais recentes</option>
                <option value="antigas">Mais antigas</option>
                <option value="nome">Nome (A–Z)</option>
                <option value="castracao">Data da castração</option>
              </select>
            </div>
          </div>

          <div className="filtros-avancados">
            <div className="filtros-titulo">
              <span>Filtros avançados</span>
              {filtrosAtivos > 0 && <b>{filtrosAtivos} ativo{filtrosAtivos === 1 ? '' : 's'}</b>}
            </div>
            <div className="grade-filtros">
              <div className="campo">
                <label htmlFor="filtro-tipo">Tipo da ficha</label>
                <select id="filtro-tipo" value={tipo} onChange={(evento) => setTipo(evento.target.value)}>
                  <option value="todos">Todos os tipos</option>
                  <option value="responsavel">Com responsável</option>
                  <option value="rua">Animal de rua</option>
                </select>
              </div>
              <div className="campo">
                <label htmlFor="filtro-especie">Espécie</label>
                <select id="filtro-especie" value={especie} onChange={(evento) => setEspecie(evento.target.value)}>
                  <option value="todas">Todas as espécies</option>
                  <option value="canino">Canino</option>
                  <option value="felino">Felino</option>
                </select>
              </div>
              <div className="campo">
                <label htmlFor="filtro-castracao">Castração</label>
                <select id="filtro-castracao" value={castracao} onChange={(evento) => setCastracao(evento.target.value)}>
                  <option value="todas">Todas as situações</option>
                  <option value="agendada">Agendada / futura</option>
                  <option value="passada">Data já passada</option>
                  <option value="com-data">Com data informada</option>
                  <option value="sem-data">Sem data informada</option>
                </select>
              </div>
              <div className="campo">
                <label htmlFor="cadastro-inicial">Cadastrada a partir de</label>
                <input id="cadastro-inicial" type="date" value={cadastroInicial} max={cadastroFinal || undefined} onChange={(evento) => setCadastroInicial(evento.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor="cadastro-final">Cadastrada até</label>
                <input id="cadastro-final" type="date" value={cadastroFinal} min={cadastroInicial || undefined} onChange={(evento) => setCadastroFinal(evento.target.value)} />
              </div>
              <button type="button" className="botao-limpar-filtros" onClick={limparFiltros} disabled={filtrosAtivos === 0 && ordenacao === 'recentes'}>
                Limpar filtros
              </button>
            </div>
          </div>

          <div className="resumo-resultados" role="status" aria-live="polite">
            <strong>{fichasFiltradas.length}</strong> {fichasFiltradas.length === 1 ? 'ficha encontrada' : 'fichas encontradas'}
            {fichasFiltradas.length !== fichas.length && <span> de {fichas.length} no total</span>}
          </div>
        </section>
      )}

      {carregando ? (
        <div className="estado-listagem">Carregando fichas…</div>
      ) : fichas.length === 0 ? (
        <div className="estado-listagem vazio">
          <strong>Nenhuma ficha salva ainda</strong>
          <p>Quando uma ficha for salva, ela aparecerá aqui.</p>
          <button type="button" onClick={onNovaFicha}>Cadastrar primeira ficha</button>
        </div>
      ) : fichasFiltradas.length === 0 ? (
        <div className="estado-listagem vazio resultado-vazio">
          <strong>Nenhuma ficha encontrada</strong>
          <p>Tente alterar os termos da pesquisa ou remover alguns filtros.</p>
          <button type="button" className="botao-secundario" onClick={limparFiltros}>Limpar pesquisa e filtros</button>
        </div>
      ) : (
        <div className="grade-fichas">
          {fichasFiltradas.map((ficha) => {
            const nomes = ficha.animais.map((animal) => animal.nome || animal.especie).filter(Boolean)
            return (
              <article className="ficha-card" key={ficha.id}>
                <button className="ficha-card-conteudo" type="button" onClick={() => void visualizar(ficha.id)}>
                  <span className={`selo-ficha ${ficha.animal_de_rua ? 'rua' : ''}`}>
                    {ficha.animal_de_rua ? 'Animal de rua' : 'Com responsável'}
                  </span>
                  <h2>{ficha.responsavel_nome || nomes[0] || 'Ficha sem nome'}</h2>
                  <p>{nomes.length ? nomes.join(', ') : 'Nenhum animal informado'}</p>
                  <dl>
                    <div><dt>Preenchida por</dt><dd className="autor-ficha">{nomePeloEmail(ficha.criado_por_email)}</dd></div>
                    <div><dt>Animais</dt><dd>{ficha.animais.length}</dd></div>
                    <div><dt>Castração</dt><dd>{formatarData(ficha.data_castracao)}</dd></div>
                    <div><dt>Criada em</dt><dd>{formatarData(ficha.criado_em)}</dd></div>
                  </dl>
                  <span className="abrir-ficha">Ver ficha completa →</span>
                </button>
                <div className="ficha-card-acoes">
                  <button type="button" className="botao-secundario" onClick={() => void editar(ficha.id)}>Editar</button>
                  <button type="button" className="botao-perigo" disabled={excluindo === ficha.id} onClick={() => void remover(ficha)}>
                    {excluindo === ficha.id ? 'Excluindo…' : 'Excluir'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {selecionada && (
        <div className="modal-fundo" role="presentation" onMouseDown={() => setSelecionada(null)}>
          <section className="modal-ficha" role="dialog" aria-modal="true" aria-labelledby="titulo-detalhes" onMouseDown={(evento) => evento.stopPropagation()}>
            <header>
              <div>
                <span className="sobretitulo">Ficha cadastrada</span>
                <h2 id="titulo-detalhes">{selecionada.responsavel?.nome || selecionada.animais[0]?.nome || 'Sem nome informado'}</h2>
              </div>
              <button type="button" className="fechar-modal" aria-label="Fechar" onClick={() => setSelecionada(null)}>×</button>
            </header>
            <div className="detalhes-ficha">
              <div><span>Tipo</span><strong>{selecionada.animal_de_rua ? 'Animal de rua' : 'Com responsável'}</strong></div>
              <div><span>Telefone</span><strong>{selecionada.responsavel?.telefone || 'Não informado'}</strong></div>
              <div><span>Data da castração</span><strong>{formatarData(selecionada.data_castracao)}</strong></div>
              <div><span>Endereço</span><strong>{selecionada.responsavel?.endereco || 'Não informado'}</strong></div>
            </div>
            <h3>Animais</h3>
            <div className="animais-detalhes">
              {selecionada.animais.length ? selecionada.animais.map((animal, indice) => (
                <div key={`${animal.nome}-${indice}`}>
                  <strong>{animal.nome || `Animal ${indice + 1}`}</strong>
                  <span>{[animal.especie, animal.raca, animal.idade].filter(Boolean).join(' • ') || 'Sem detalhes'}</span>
                </div>
              )) : <p>Nenhum animal informado.</p>}
            </div>
            {selecionada.observacoes && <div className="observacoes-detalhes"><span>Observações</span><p>{selecionada.observacoes}</p></div>}
            <footer>
              <button type="button" className="botao-secundario" onClick={() => setSelecionada(null)}>Fechar</button>
              <button type="button" onClick={() => onEditar(selecionada)}>Editar ficha</button>
            </footer>
          </section>
        </div>
      )}
    </section>
  )
}
