import { jsPDF } from 'jspdf'

export type DadosFicha = Record<string, string>

const MARGEM = 10
const LARGURA = 190

function valor(dados: DadosFicha, campo: string) {
  return dados[campo]?.trim() ?? ''
}

function marcado(dados: DadosFicha, campo: string) {
  return valor(dados, campo) ? 'X' : ' '
}

function dataFormatada(data: string) {
  if (!data) return ''
  const [ano, mes, dia] = data.split('-')
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data
}

function dataPorExtenso(data: string) {
  if (!data) return '____ de __________________ de ________'
  const [ano, mes, dia] = data.split('-')
  const meses = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ]
  const nomeMes = meses[Number(mes) - 1]
  return dia && nomeMes && ano
    ? `${Number(dia)} de ${nomeMes} de ${ano}`
    : data
}

function dinheiro(numero: string) {
  if (!numero) return ''
  const valorNumerico = Number(numero)
  if (Number.isNaN(valorNumerico)) return numero
  return valorNumerico.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function textoOpcao(valorAtual: string, opcoes: string[]) {
  return opcoes
    .map((opcao) => `[${valorAtual === opcao.toLowerCase() ? 'X' : ' '}] ${opcao}`)
    .join('   ')
}

function campoLinha(
  doc: jsPDF,
  rotulo: string,
  conteudo: string,
  x: number,
  y: number,
  largura: number,
) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.2)
  doc.text(`${rotulo}:`, x, y)
  const larguraRotulo = doc.getTextWidth(`${rotulo}:`) + 1.5
  const inicio = x + larguraRotulo

  doc.setDrawColor(70)
  doc.setLineWidth(0.2)
  doc.line(inicio, y + 0.7, x + largura, y + 0.7)

  if (conteudo) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    const disponivel = Math.max(largura - larguraRotulo - 1, 5)
    const texto = doc.splitTextToSize(conteudo, disponivel)[0] ?? ''
    doc.text(texto, inicio + 1, y - 0.2)
  }
}

function textoNaCelula(
  doc: jsPDF,
  texto: string,
  x: number,
  y: number,
  largura: number,
  altura: number,
) {
  const linhas = doc.splitTextToSize(texto || '', largura - 2).slice(0, 2)
  const alturaLinha = 3.1
  const inicioY = y + altura / 2 - ((linhas.length - 1) * alturaLinha) / 2 + 1
  doc.text(linhas, x + largura / 2, inicioY, {
    align: 'center',
    baseline: 'middle',
  })
}

export function criarFichaPdf(dados: DadosFicha) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  doc.setProperties({
    title: 'Ficha cadastral - Projeto Castracao',
    subject: 'Ficha cadastral preenchida',
    creator: 'Projeto APPA',
  })

  doc.setTextColor(0)
  doc.setDrawColor(0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('FICHA CADASTRAL - PROJETO CASTRAÇÃO', 105, 10, {
    align: 'center',
  })
  doc.setLineWidth(0.2)
  doc.line(70, 11, 140, 11)

  let y = 17
  campoLinha(doc, 'NOME', valor(dados, 'nome'), MARGEM, y, LARGURA)
  y += 7
  campoLinha(doc, 'PROFISSÃO', valor(dados, 'profissao'), MARGEM, y, 70)
  campoLinha(doc, 'RG', valor(dados, 'rg'), 82, y, 50)
  campoLinha(doc, 'CPF', valor(dados, 'cpf'), 134, y, 66)
  y += 7
  campoLinha(doc, 'NIS - CadÚnico', valor(dados, 'nis'), MARGEM, y, 105)
  y += 7
  campoLinha(doc, 'ENDEREÇO', valor(dados, 'endereco'), MARGEM, y, 135)
  campoLinha(doc, 'TELEFONE', valor(dados, 'telefone'), 147, y, 53)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.2)
  doc.text(
    `RESIDÊNCIA: ${textoOpcao(valor(dados, 'residencia'), [
      'Própria',
      'Alugada',
      'Financiada',
      'Cedida',
    ])}`,
    MARGEM,
    y,
  )
  y += 7

  const possuiVeiculo = valor(dados, 'possuiVeiculo')
  doc.text(
    `VEÍCULO: [${possuiVeiculo === 'sim' ? 'X' : ' '}] Sim   ` +
      `[${possuiVeiculo === 'nao' ? 'X' : ' '}] Não`,
    MARGEM,
    y,
  )
  campoLinha(doc, 'MARCA/MODELO/ANO', valor(dados, 'veiculo'), 62, y, 95)
  doc.text(
    `[${marcado(dados, 'veiculoFinanciado')}] Financiado`,
    160,
    y,
  )
  y += 7

  campoLinha(
    doc,
    'RENDA FAMILIAR',
    dinheiro(valor(dados, 'rendaFamiliar')),
    MARGEM,
    y,
    LARGURA,
  )
  y += 7
  campoLinha(
    doc,
    'QUANTAS PESSOAS MORAM NA RESIDÊNCIA',
    valor(dados, 'quantidadeMoradores'),
    MARGEM,
    y,
    105,
  )
  campoLinha(
    doc,
    'QUANTOS DEPENDENTES',
    valor(dados, 'quantidadeDependentes'),
    117,
    y,
    83,
  )
  y += 7

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text(
    'NOME COMPLETO, IDADE E RENDA DE QUEM CONTRIBUI PARA A RENDA FAMILIAR:',
    MARGEM,
    y,
  )
  y += 5

  for (let numero = 1; numero <= 3; numero += 1) {
    const pessoa = [
      valor(dados, `morador${numero}Nome`),
      valor(dados, `morador${numero}Idade`)
        ? `${valor(dados, `morador${numero}Idade`)} anos`
        : '',
      dinheiro(valor(dados, `morador${numero}Renda`)),
    ]
      .filter(Boolean)
      .join(' - ')
    campoLinha(doc, String(numero), pessoa, MARGEM, y, LARGURA)
    y += 6
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.2)
  doc.text('SOBRE OS ANIMAIS A SEREM ESTERILIZADOS:', MARGEM, y)
  y += 3

  const colunas = [
    { titulo: 'NOME DO ANIMAL', largura: 36 },
    { titulo: 'ESPÉCIE', largura: 24 },
    { titulo: 'RAÇA', largura: 35 },
    { titulo: 'IDADE', largura: 18 },
    { titulo: 'VACINAS', largura: 23 },
    { titulo: 'PESO', largura: 18 },
    { titulo: 'ÚLTIMO CIO', largura: 36 },
  ]
  const alturaCabecalho = 11
  const alturaLinha = 10
  let x = MARGEM

  doc.setLineWidth(0.25)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.8)
  for (const coluna of colunas) {
    doc.rect(x, y, coluna.largura, alturaCabecalho)
    textoNaCelula(doc, coluna.titulo, x, y, coluna.largura, alturaCabecalho)
    x += coluna.largura
  }
  y += alturaCabecalho

  for (let numero = 1; numero <= 3; numero += 1) {
    const celulas = [
      valor(dados, `animal${numero}Nome`),
      valor(dados, `animal${numero}Especie`),
      valor(dados, `animal${numero}Raca`),
      valor(dados, `animal${numero}Idade`),
      valor(dados, `animal${numero}Vacinas`),
      valor(dados, `animal${numero}Peso`)
        ? `${valor(dados, `animal${numero}Peso`)} kg`
        : '',
      dataFormatada(valor(dados, `animal${numero}UltimoCio`)),
    ]
    x = MARGEM
    celulas.forEach((celula, indice) => {
      const largura = colunas[indice].largura
      doc.rect(x, y, largura, alturaLinha)
      textoNaCelula(
        doc,
        celula ? celula.toUpperCase() : '',
        x,
        y,
        largura,
        alturaLinha,
      )
      x += largura
    })
    y += alturaLinha
  }

  y += 5
  campoLinha(
    doc,
    'OBSERVAÇÕES',
    valor(dados, 'observacoes'),
    MARGEM,
    y,
    LARGURA,
  )
  y += 7

  const observacoes = [
    '1) Animais que possuem hérnia umbilical, testículos internos ou piometra serão castrados com acréscimo de valor, pago no dia da castração.',
    '2) Não serão feitos exames pré-operatórios. Doenças preexistentes devem ser obrigatoriamente informadas pelo responsável.',
    '3) Animais braquicefálicos e outras raças com essa característica terão acréscimo de valor devido ao risco anestésico.',
    '4) No pós-operatório, o responsável deverá seguir os cuidados orientados. Novo procedimento por falta de cuidado não será gratuito.',
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.3)
  for (const observacao of observacoes) {
    const linhas = doc.splitTextToSize(observacao, LARGURA)
    doc.text(linhas, MARGEM, y)
    y += linhas.length * 2.8 + 1
  }

  const nome = valor(dados, 'nome') || '________________________________'
  const declaracao =
    `Eu, ${nome}, declaro para os devidos fins que as informações acima prestadas ` +
    'são verdadeiras e estou ciente de que poderei ser fiscalizado(a) pela APPA e pela Prefeitura de Papanduva - SC. ' +
    'Caso os dados não sejam verdadeiros, o fato poderá constituir crime de falsidade ideológica, conforme art. 299 do Código Penal.'
  const linhasDeclaracao = doc.splitTextToSize(declaracao, LARGURA)
  doc.text(linhasDeclaracao, MARGEM, y)
  y += linhasDeclaracao.length * 2.8 + 3

  doc.text(
    `Papanduva - SC, ${dataPorExtenso(valor(dados, 'dataDeclaracao'))}.`,
    105,
    y,
    { align: 'center' },
  )
  y += 12

  doc.line(65, y, 145, y)
  doc.text('Assinatura', 105, y + 3.5, { align: 'center' })
  campoLinha(
    doc,
    'DATA DA CASTRAÇÃO',
    dataFormatada(valor(dados, 'dataCastracao')),
    MARGEM,
    y + 10,
    75,
  )

  return doc
}

export function baixarFichaPdf(dados: DadosFicha) {
  const doc = criarFichaPdf(dados)
  const nome = valor(dados, 'nome')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  doc.save(nome ? `ficha-castracao-${nome}.pdf` : 'ficha-castracao.pdf')
}
