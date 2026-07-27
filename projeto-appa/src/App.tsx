import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

const moradores = [1, 2, 3]
const animais = [1, 2, 3]

function App() {
  const [mensagem, setMensagem] = useState('')

  function enviarFicha(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensagem(
      'Ficha preenchida. A geração do documento será implementada em uma próxima etapa.',
    )
  }

  return (
    <main className="pagina">
      <section className="formulario-container" aria-labelledby="titulo-pagina">
        <header>
          <h1 id="titulo-pagina">Ficha cadastral — Projeto Castração</h1>
          <p>Preencha os dados do responsável e dos animais.</p>
        </header>

        <form onSubmit={enviarFicha}>
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

          <fieldset>
            <legend>Animais a serem esterilizados</legend>

            {animais.map((numero) => (
              <section className="animal" key={numero} aria-labelledby={`animal-${numero}`}>
                <div className="cabecalho-animal">
                  <h2 id={`animal-${numero}`}>Animal {numero}</h2>
                  <label className="switch">
                    <span>Animal de rua</span>
                    <input
                      type="checkbox"
                      role="switch"
                      name={`animal${numero}DeRua`}
                    />
                    <span className="switch-trilho" aria-hidden="true" />
                  </label>
                </div>

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
          </fieldset>

          <fieldset>
            <legend>Declaração</legend>

            <div className="aviso">
              <p>
                Animais com hérnia umbilical, testículos internos ou piometra
                poderão ter acréscimo no valor da castração.
              </p>
              <p>
                Não serão realizados exames pré-operatórios. Doenças
                preexistentes devem ser informadas pelo responsável.
              </p>
              <p>
                Animais braquicefálicos e outras raças com essa característica
                poderão ter acréscimo devido ao risco anestésico.
              </p>
              <p>
                O responsável deverá seguir os cuidados pós-operatórios
                orientados pela equipe.
              </p>
            </div>

            <label className="aceite">
              <input type="checkbox" name="aceiteDeclaracao" />
              Declaro que as informações prestadas são verdadeiras e estou
              ciente das condições acima.
            </label>

            <div className="grade">
              <div className="campo">
                <label htmlFor="data-declaracao">Data da declaração</label>
                <input id="data-declaracao" name="dataDeclaracao" type="date" />
              </div>
              <div className="campo">
                <label htmlFor="data-castracao">Data da castração</label>
                <input id="data-castracao" name="dataCastracao" type="date" />
              </div>
            </div>
          </fieldset>

          <div className="acoes">
            <button
              type="reset"
              className="botao-secundario"
              onClick={() => setMensagem('')}
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
  )
}

export default App
