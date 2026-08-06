import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import './App.css'
import { enviarImagensDaFicha, salvarFicha } from './salvarFicha'
import type { FichaPayload, ResponsavelPayload } from './salvarFicha'
import { atualizarFicha } from './fichasApi'
import type { FichaCompleta } from './fichasApi'
import FichasPage from './FichasPage'
import { supabase } from './supabase'
import Login, { RedefinirSenha } from './Login'

const moradores = [1, 2, 3]
const animais = [1, 2, 3]

function nomeDoUsuario(usuario: User) {
  const nome = usuario.user_metadata.full_name ?? usuario.user_metadata.name
  return typeof nome === 'string' && nome.trim() ? nome.trim() : null
}

function texto(formulario: FormData, campo: string) {
  const conteudo = formulario.get(campo)
  if (typeof conteudo !== 'string') return null
  return conteudo.trim() || null
}

function opcaoBooleana(valor: string | null) {
  if (valor === 'sim') return true
  if (valor === 'nao') return false
  return null
}

function residenciaNormalizada(valor: string | null) {
  return valor
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') ?? null
}

function criarPayload(
  formulario: FormData,
  usuario: User,
  animalDeRua: boolean,
): FichaPayload {
  const responsavel: ResponsavelPayload = {
    nome: texto(formulario, 'nome'),
    profissao: texto(formulario, 'profissao'),
    rg: texto(formulario, 'rg'),
    cpf: texto(formulario, 'cpf'),
    nis: texto(formulario, 'nis'),
    endereco: texto(formulario, 'endereco'),
    telefone: texto(formulario, 'telefone'),
    residencia: residenciaNormalizada(texto(formulario, 'residencia')),
    possui_veiculo: opcaoBooleana(texto(formulario, 'possuiVeiculo')),
    veiculo_descricao: texto(formulario, 'veiculo'),
    veiculo_financiado: formulario.has('veiculoFinanciado'),
    renda_familiar: texto(formulario, 'rendaFamiliar'),
    quantidade_moradores: texto(formulario, 'quantidadeMoradores'),
    quantidade_dependentes: texto(formulario, 'quantidadeDependentes'),
  }

  const responsavelPreenchido = Object.entries(responsavel).some(
    ([campo, valor]) =>
      campo === 'veiculo_financiado' ? valor === true : valor !== null,
  )

  const moradoresPreenchidos = moradores
    .map((numero) => ({
      nome: texto(formulario, `morador${numero}Nome`),
      idade: texto(formulario, `morador${numero}Idade`),
      renda: texto(formulario, `morador${numero}Renda`),
    }))
    .filter((morador) => Object.values(morador).some((valor) => valor !== null))

  const animaisPreenchidos = animais
    .map((numero) => ({
      nome: texto(formulario, `animal${numero}Nome`),
      especie: texto(formulario, `animal${numero}Especie`),
      raca: texto(formulario, `animal${numero}Raca`),
      idade: texto(formulario, `animal${numero}Idade`),
      vacinado: opcaoBooleana(texto(formulario, `animal${numero}Vacinas`)),
      peso: texto(formulario, `animal${numero}Peso`),
      ultimo_cio: texto(formulario, `animal${numero}UltimoCio`),
    }))
    .filter((animal) => Object.values(animal).some((valor) => valor !== null))

  return {
    usuario: {
      email: usuario.email ?? null,
      nome: nomeDoUsuario(usuario),
    },
    animal_de_rua: animalDeRua,
    responsavel:
      animalDeRua || !responsavelPreenchido ? null : responsavel,
    moradores: animalDeRua ? [] : moradoresPreenchidos,
    animais: animaisPreenchidos,
    observacoes: texto(formulario, 'observacoes'),
    data_castracao: texto(formulario, 'dataCastracao'),
  }
}

function preencherCampo(
  formulario: HTMLFormElement,
  nome: string,
  valor: string | number | boolean | null | undefined,
) {
  const controles = Array.from(formulario.elements).filter(
    (elemento): elemento is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
      'name' in elemento && elemento.name === nome,
  )

  controles.forEach((controle) => {
    if (controle instanceof HTMLInputElement && controle.type === 'radio') {
      controle.checked = String(valor) === controle.value
    } else if (controle instanceof HTMLInputElement && controle.type === 'checkbox') {
      controle.checked = Boolean(valor)
    } else {
      controle.value = valor == null ? '' : String(valor)
    }
  })
}

function preencherFormulario(formulario: HTMLFormElement, ficha: FichaCompleta) {
  formulario.reset()
  const responsavel = ficha.responsavel
  const campos = {
    nome: responsavel?.nome,
    profissao: responsavel?.profissao,
    rg: responsavel?.rg,
    cpf: responsavel?.cpf,
    nis: responsavel?.nis,
    endereco: responsavel?.endereco,
    telefone: responsavel?.telefone,
    residencia: responsavel?.residencia,
    possuiVeiculo: responsavel?.possui_veiculo == null ? null : responsavel.possui_veiculo ? 'sim' : 'nao',
    veiculo: responsavel?.veiculo_descricao,
    veiculoFinanciado: responsavel?.veiculo_financiado,
    rendaFamiliar: responsavel?.renda_familiar,
    quantidadeMoradores: responsavel?.quantidade_moradores,
    quantidadeDependentes: responsavel?.quantidade_dependentes,
  }
  Object.entries(campos).forEach(([nome, valor]) => preencherCampo(formulario, nome, valor))
  moradores.forEach((numero, indice) => {
    const morador = ficha.moradores[indice]
    preencherCampo(formulario, `morador${numero}Nome`, morador?.nome)
    preencherCampo(formulario, `morador${numero}Idade`, morador?.idade)
    preencherCampo(formulario, `morador${numero}Renda`, morador?.renda)
  })
  animais.forEach((numero, indice) => {
    const animal = ficha.animais[indice]
    preencherCampo(formulario, `animal${numero}Nome`, animal?.nome)
    preencherCampo(formulario, `animal${numero}Especie`, animal?.especie)
    preencherCampo(formulario, `animal${numero}Raca`, animal?.raca)
    preencherCampo(formulario, `animal${numero}Idade`, animal?.idade)
    preencherCampo(formulario, `animal${numero}Vacinas`, animal?.vacinado == null ? null : animal.vacinado ? 'sim' : 'nao')
    preencherCampo(formulario, `animal${numero}Peso`, animal?.peso)
    preencherCampo(formulario, `animal${numero}UltimoCio`, animal?.ultimo_cio)
  })
  preencherCampo(formulario, 'observacoes', ficha.observacoes)
  preencherCampo(formulario, 'dataCastracao', ficha.data_castracao)
}

function Painel({
  usuario,
}: {
  usuario: User
}) {
  const [mensagem, setMensagem] = useState('')
  const [mensagemTipo, setMensagemTipo] = useState<'sucesso' | 'erro' | 'andamento'>('sucesso')
  const [animalDeRua, setAnimalDeRua] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [tela, setTela] = useState<'formulario' | 'fichas'>(
    window.location.hash === '#todas-fichas' ? 'fichas' : 'formulario',
  )
  const [fichaEdicao, setFichaEdicao] = useState<FichaCompleta | null>(null)
  const formularioRef = useRef<HTMLFormElement>(null)
  const nomeUsuario = nomeDoUsuario(usuario)
  const emailUsuario = usuario.email ?? 'Conta de voluntário'
  const iniciaisUsuario = (nomeUsuario ?? emailUsuario)
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase() || 'VO'

  function abrirNovaFicha() {
    setFichaEdicao(null)
    setAnimalDeRua(false)
    setMensagem('')
    formularioRef.current?.reset()
    setTela('formulario')
    window.history.pushState(null, '', '#nova-ficha')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function abrirTodasAsFichas() {
    setTela('fichas')
    window.history.pushState(null, '', '#todas-fichas')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function abrirEdicao(ficha: FichaCompleta) {
    setFichaEdicao(ficha)
    setAnimalDeRua(ficha.animal_de_rua)
    setMensagem('')
    setTela('formulario')
    window.history.pushState(null, '', '#editar-ficha')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    if (tela !== 'formulario' || !fichaEdicao || !formularioRef.current) return
    const quadro = window.requestAnimationFrame(() => {
      if (formularioRef.current) preencherFormulario(formularioRef.current, fichaEdicao)
    })
    return () => window.cancelAnimationFrame(quadro)
  }, [tela, fichaEdicao])

  useEffect(() => {
    const sincronizarTela = () => {
      const destino = window.location.hash === '#todas-fichas' ? 'fichas' : 'formulario'
      setTela(destino)
      if (destino === 'fichas') setFichaEdicao(null)
    }
    window.addEventListener('popstate', sincronizarTela)
    return () => window.removeEventListener('popstate', sincronizarTela)
  }, [])

  async function enviarFicha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formulario = new FormData(event.currentTarget)
    const imagens = formulario
      .getAll('imagensAnimais')
      .filter(
        (conteudo): conteudo is File =>
          conteudo instanceof File && conteudo.size > 0,
      )

    setSalvando(true)
    setMensagemTipo('andamento')
    setMensagem('Salvando a ficha no banco de dados…')

    try {
      const payload = criarPayload(formulario, usuario, animalDeRua)
      const resultado = fichaEdicao
        ? await atualizarFicha(fichaEdicao.id, payload)
        : await salvarFicha(payload, imagens, usuario)
      if (fichaEdicao && imagens.length) {
        await enviarImagensDaFicha(
          imagens,
          usuario,
          resultado.ficha_id,
          resultado.usuario_id,
        )
      }
      setMensagemTipo('sucesso')
      setMensagem('Ficha salva com sucesso.')
      formularioRef.current?.reset()
      setFichaEdicao(null)
      setAnimalDeRua(false)
      setTela('fichas')
      window.history.pushState(null, '', '#todas-fichas')
    } catch (erro) {
      console.error('Erro ao processar a ficha:', erro)
      setMensagemTipo('erro')
      setMensagem(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível salvar a ficha. Tente novamente.',
      )
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="marca">
          <div className="marca-simbolo" aria-hidden="true">
            <img src="/logo-appa.png" alt="" />
          </div>
          <div>
            <strong>APPA</strong>
          </div>
        </div>

        <div className="perfil">
          <div className="avatar" aria-hidden="true">
            {iniciaisUsuario}
          </div>
          <div>
            <strong>{nomeUsuario || 'Voluntário(a)'}</strong>
            <span>
              <i aria-hidden="true" />
              {emailUsuario}
            </span>
          </div>
        </div>

        <nav className="menu" aria-label="Menu principal">
          <p>Cadastros</p>
          <button className={`item-menu ${tela === 'formulario' ? 'ativo' : ''}`} type="button" onClick={abrirNovaFicha} aria-current={tela === 'formulario' ? 'page' : undefined}>
            <span>
              <b className="menu-icone" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </b>
              Nova ficha
            </span>
            {tela === 'formulario' && <small>Atual</small>}
          </button>
          <button className={`item-menu ${tela === 'fichas' ? 'ativo' : ''}`} type="button" onClick={abrirTodasAsFichas} aria-current={tela === 'fichas' ? 'page' : undefined}>
            <span>
              <b className="menu-icone" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-icon lucide-list"><path d="M3 5h.01"/><path d="M3 12h.01"/><path d="M3 19h.01"/><path d="M8 5h13"/><path d="M8 12h13"/><path d="M8 19h13"/></svg>
              </b>
              Todas as fichas
            </span>
            {tela === 'fichas' && <small>Atual</small>}
          </button>
          <div className="item-menu item-futuro">
            <span>
              <b className="menu-icone" aria-hidden="true">A</b>
              Todos os animais
            </span>
            <small>Em breve</small>
          </div>
          <div className="item-menu item-futuro">
            <span>
              <b className="menu-icone" aria-hidden="true">C</b>
              Agendamentos
            </span>
            <small>Em breve</small>
          </div>
        </nav>

        <div className="sidebar-rodape">
          <span aria-hidden="true" />
          Ambiente interno
        </div>
        <button
          type="button"
          className="botao-sair"
          onClick={() => void supabase?.auth.signOut()}
        >
          Sair da conta
        </button>
      </aside>

      <main className="pagina" id={tela === 'formulario' ? 'nova-ficha' : 'todas-fichas'}>
        {tela === 'fichas' ? (
          <FichasPage onNovaFicha={abrirNovaFicha} onEditar={abrirEdicao} />
        ) : (
        <section className="formulario-container" aria-labelledby="titulo-pagina">
        <header className="cabecalho-pagina">
          <div>
            <span className="sobretitulo">Projeto Castração</span>
            <h1 id="titulo-pagina">{fichaEdicao ? 'Editar ficha cadastral' : 'Nova ficha cadastral'}</h1>
            <p>{fichaEdicao ? 'Atualize os dados necessários e salve as alterações.' : 'Registre os dados do responsável e dos animais.'}</p>
          </div>
          <span className="uso-interno">Uso interno</span>
        </header>

        <form className="formulario" ref={formularioRef} onSubmit={enviarFicha}>
          <div className="controle-animal-rua">
            <div>
              <strong>Animal de rua</strong>
              <p>Ative quando não houver uma pessoa responsável pelo animal.</p>
            </div>
            <label className="switch">
              <span className="texto-switch">
                {animalDeRua ? 'Ativado' : 'Desativado'}
              </span>
              <input
                type="checkbox"
                role="switch"
                name="animalDeRua"
                value="sim"
                checked={animalDeRua}
                onChange={(event) => {
                  setAnimalDeRua(event.target.checked)
                  setMensagem('')
                }}
              />
              <span className="switch-trilho" aria-hidden="true" />
            </label>
          </div>

          {!animalDeRua && (
            <fieldset>
              <legend>Dados do responsável</legend>

              <div className="campo">
                <label htmlFor="nome">Nome completo</label>
                <input id="nome" name="nome" type="text" autoComplete="name" />
              </div>

              <div className="grade grade-3">
                <div className="campo">
                  <label htmlFor="profissao">Profissão</label>
                  <input id="profissao" name="profissao" type="text" />
                </div>
                <div className="campo">
                  <label htmlFor="rg">RG</label>
                  <input id="rg" name="rg" type="text" />
                </div>
                <div className="campo">
                  <label htmlFor="cpf">CPF</label>
                  <input
                    id="cpf"
                    name="cpf"
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="campo">
                <label htmlFor="nis">NIS / CadÚnico</label>
                <input id="nis" name="nis" type="text" inputMode="numeric" />
              </div>

              <div className="grade grade-endereco">
                <div className="campo">
                  <label htmlFor="endereco">Endereço</label>
                  <input
                    id="endereco"
                    name="endereco"
                    type="text"
                    autoComplete="street-address"
                  />
                </div>
                <div className="campo">
                  <label htmlFor="telefone">Telefone</label>
                  <input
                    id="telefone"
                    name="telefone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="campo">
                <span className="rotulo">Residência</span>
                <div className="opcoes">
                  {['Própria', 'Alugada', 'Financiada', 'Cedida'].map((opcao) => (
                    <label className="opcao" key={opcao}>
                      <input
                        type="radio"
                        name="residencia"
                        value={opcao.toLowerCase()}
                      />
                      {opcao}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grade grade-veiculo">
                <div className="campo">
                  <span className="rotulo">Possui veículo?</span>
                  <div className="opcoes">
                    <label className="opcao">
                      <input type="radio" name="possuiVeiculo" value="sim" />
                      Sim
                    </label>
                    <label className="opcao">
                      <input type="radio" name="possuiVeiculo" value="nao" />
                      Não
                    </label>
                  </div>
                </div>
                <div className="campo">
                  <label htmlFor="veiculo">Marca, modelo e ano</label>
                  <input id="veiculo" name="veiculo" type="text" />
                </div>
                <div className="campo">
                  <label className="opcao opcao-financiado">
                    <input type="checkbox" name="veiculoFinanciado" />
                    Veículo financiado
                  </label>
                </div>
              </div>
            </fieldset>
          )}

          {!animalDeRua && (
            <fieldset>
              <legend>Informações familiares</legend>

            <div className="campo">
              <label htmlFor="renda-familiar">Renda familiar mensal</label>
              <input
                id="renda-familiar"
                name="rendaFamiliar"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="R$ 0,00"
              />
            </div>

            <div className="grade">
              <div className="campo">
                <label htmlFor="moradores">Quantas pessoas moram na residência?</label>
                <input
                  id="moradores"
                  name="quantidadeMoradores"
                  type="number"
                  min="1"
                  inputMode="numeric"
                />
              </div>
              <div className="campo">
                <label htmlFor="dependentes">Quantos dependentes?</label>
                <input
                  id="dependentes"
                  name="quantidadeDependentes"
                  type="number"
                  min="0"
                  inputMode="numeric"
                />
              </div>
            </div>

            <p className="instrucao">
              Informe nome, idade e renda de quem contribui para a renda familiar.
            </p>

            {moradores.map((numero) => (
              <div className="grade grade-morador" key={numero}>
                <div className="campo">
                  <label htmlFor={`morador-${numero}`}>Nome da pessoa {numero}</label>
                  <input id={`morador-${numero}`} name={`morador${numero}Nome`} type="text" />
                </div>
                <div className="campo">
                  <label htmlFor={`idade-morador-${numero}`}>Idade</label>
                  <input
                    id={`idade-morador-${numero}`}
                    name={`morador${numero}Idade`}
                    type="number"
                    min="0"
                    inputMode="numeric"
                  />
                </div>
                <div className="campo">
                  <label htmlFor={`renda-morador-${numero}`}>Renda mensal</label>
                  <input
                    id={`renda-morador-${numero}`}
                    name={`morador${numero}Renda`}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                  />
                </div>
              </div>
            ))}
            </fieldset>
          )}

          <fieldset>
            <legend>Animais a serem esterilizados</legend>

            {animais.map((numero) => (
              <section className="animal" key={numero} aria-labelledby={`animal-${numero}`}>
                <h2 id={`animal-${numero}`}>Animal {numero}</h2>

                <div className="grade grade-animal">
                  <div className="campo campo-nome-animal">
                    <label htmlFor={`nome-animal-${numero}`}>Nome do animal</label>
                    <input
                      id={`nome-animal-${numero}`}
                      name={`animal${numero}Nome`}
                      type="text"
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor={`especie-${numero}`}>Espécie</label>
                    <select
                      id={`especie-${numero}`}
                      name={`animal${numero}Especie`}
                      defaultValue=""
                    >
                      <option value="">Selecione</option>
                      <option value="canino">Canino</option>
                      <option value="felino">Felino</option>
                    </select>
                  </div>
                  <div className="campo">
                    <label htmlFor={`raca-${numero}`}>Raça</label>
                    <input id={`raca-${numero}`} name={`animal${numero}Raca`} type="text" />
                  </div>
                  <div className="campo">
                    <label htmlFor={`idade-animal-${numero}`}>Idade</label>
                    <input
                      id={`idade-animal-${numero}`}
                      name={`animal${numero}Idade`}
                      type="text"
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor={`vacinas-${numero}`}>Vacinas em dia?</label>
                    <select
                      id={`vacinas-${numero}`}
                      name={`animal${numero}Vacinas`}
                      defaultValue=""
                    >
                      <option value="">Selecione</option>
                      <option value="sim">Sim</option>
                      <option value="nao">Não</option>
                    </select>
                  </div>
                  <div className="campo">
                    <label htmlFor={`peso-${numero}`}>Peso (kg)</label>
                    <input
                      id={`peso-${numero}`}
                      name={`animal${numero}Peso`}
                      type="number"
                      min="0"
                      step="0.1"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor={`cio-${numero}`}>Último cio</label>
                    <input
                      id={`cio-${numero}`}
                      name={`animal${numero}UltimoCio`}
                      type="date"
                    />
                  </div>
                </div>
              </section>
            ))}

            <div className="campo">
              <label htmlFor="observacoes">Observações sobre os animais</label>
              <textarea id="observacoes" name="observacoes" rows={4} />
            </div>

            <div className="campo campo-data-castracao">
              <label htmlFor="data-castracao">Data da castração</label>
              <input id="data-castracao" name="dataCastracao" type="date" />
            </div>
          </fieldset>

          <fieldset>
            <legend>Imagens dos animais</legend>
            <div className="campo">
              <label htmlFor="imagens-animais">Selecionar imagens</label>
              <input
                id="imagens-animais"
                name="imagensAnimais"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
              />
              <small>
                Campo opcional. As imagens não serão incluídas no PDF.
              </small>
            </div>
          </fieldset>

          <div className="acoes">
            <button
              type="reset"
              className="botao-secundario"
              disabled={salvando}
              onClick={() => {
                setMensagem('')
                setAnimalDeRua(false)
                setFichaEdicao(null)
                window.history.replaceState(null, '', '#nova-ficha')
              }}
            >
              {fichaEdicao ? 'Cancelar edição' : 'Limpar'}
            </button>
            <button type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : fichaEdicao ? 'Salvar alterações' : 'Salvar ficha'}
            </button>
          </div>

          {mensagem && (
            <p
              className={`mensagem mensagem-${mensagemTipo}`}
              role={mensagemTipo === 'erro' ? 'alert' : 'status'}
            >
              {mensagem}
            </p>
          )}
        </form>
        </section>
        )}
      </main>
    </div>
  )
}

function App() {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [redefinindoSenha, setRedefinindoSenha] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setCarregando(false)
      return
    }

    let ativo = true

    const aplicarSessao = (usuarioAtual: User | null) => {
      if (!ativo) return
      setUsuario(usuarioAtual)
      setCarregando(false)
    }

    void supabase.auth.getSession().then(({ data }) => {
      aplicarSessao(data.session?.user ?? null)
    })

    const { data: observador } = supabase.auth.onAuthStateChange(
      (evento, sessao) => {
        if (evento === 'PASSWORD_RECOVERY') setRedefinindoSenha(true)
        if (evento === 'SIGNED_OUT') setRedefinindoSenha(false)
        aplicarSessao(sessao?.user ?? null)
      },
    )

    return () => {
      ativo = false
      observador.subscription.unsubscribe()
    }
  }, [])

  if (carregando) {
    return (
      <main className="carregando-auth" aria-live="polite">
        <div>
          <span aria-hidden="true" />
          Verificando acesso…
        </div>
      </main>
    )
  }

  if (redefinindoSenha) {
    return <RedefinirSenha onConcluido={() => setRedefinindoSenha(false)} />
  }

  return usuario ? (
    <Painel usuario={usuario} />
  ) : (
    <Login />
  )
}

export default App
