import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import './App.css'
import { baixarFichaPdf } from './gerarFichaPdf'
import { auth, persistenciaConfigurada } from './firebase'
import Login from './Login'

const moradores = [1, 2, 3]
const animais = [1, 2, 3]

function Painel({ usuario }: { usuario: User }) {
  const [mensagem, setMensagem] = useState('')
  const [animalDeRua, setAnimalDeRua] = useState(false)
  const emailUsuario = usuario.email ?? 'Conta de voluntário'
  const iniciaisUsuario = (usuario.displayName ?? emailUsuario)
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase() || 'VO'

  function enviarFicha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formulario = new FormData(event.currentTarget)
    const dados = Object.fromEntries(
      Array.from(formulario.entries(), ([chave, conteudo]) => [
        chave,
        String(conteudo),
      ]),
    )

    baixarFichaPdf(dados)
    setMensagem('PDF gerado e baixado com sucesso.')
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
            <span>Gestão interna</span>
          </div>
        </div>

        <div className="perfil">
          <div className="avatar" aria-hidden="true">
            {iniciaisUsuario}
          </div>
          <div>
            <strong>{usuario.displayName || 'Voluntário(a)'}</strong>
            <span>
              <i aria-hidden="true" />
              {emailUsuario}
            </span>
          </div>
        </div>

        <nav className="menu" aria-label="Menu principal">
          <p>Cadastros</p>
          <a className="item-menu ativo" href="#nova-ficha" aria-current="page">
            <span>
              <b className="menu-icone" aria-hidden="true">N</b>
              Nova ficha
            </span>
            <small>Atual</small>
          </a>
          <div className="item-menu item-futuro">
            <span>
              <b className="menu-icone" aria-hidden="true">P</b>
              Planilha completa
            </span>
            <small>Em breve</small>
          </div>
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
          onClick={() => auth && signOut(auth)}
        >
          Sair da conta
        </button>
      </aside>

      <main className="pagina" id="nova-ficha">
        <section className="formulario-container" aria-labelledby="titulo-pagina">
        <header className="cabecalho-pagina">
          <div>
            <span className="sobretitulo">Projeto Castração</span>
            <h1 id="titulo-pagina">Nova ficha cadastral</h1>
            <p>Registre os dados do responsável e dos animais para gerar o documento.</p>
          </div>
          <span className="uso-interno">Uso interno</span>
        </header>

        <form className="formulario" onSubmit={enviarFicha}>
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
                accept="image/*"
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
              onClick={() => {
                setMensagem('')
                setAnimalDeRua(false)
              }}
            >
              Limpar
            </button>
            <button type="submit">Gerar ficha</button>
          </div>

          {mensagem && (
            <p className="mensagem" role="status">
              {mensagem}
            </p>
          )}
        </form>
        </section>
      </main>
    </div>
  )
}

function App() {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const authAtual = auth

    if (!authAtual) {
      setCarregando(false)
      return
    }

    let ativo = true
    let cancelarObservacao: () => void = () => {}

    persistenciaConfigurada
      .then(() => {
        if (!ativo) return

        cancelarObservacao = onAuthStateChanged(authAtual, (usuarioAtual) => {
          if (!ativo) return
          setUsuario(usuarioAtual)
          setCarregando(false)
        })
      })
      .catch(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
      cancelarObservacao()
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

  return usuario ? <Painel usuario={usuario} /> : <Login />
}

export default App
