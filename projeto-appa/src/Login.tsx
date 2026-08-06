import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase, supabaseConfigurado } from './supabase'
import './Login.css'

type Modo = 'entrar' | 'criar'

function mensagemCadastro(mensagem: string) {
  const erro = mensagem.toLowerCase()
  if (erro.includes('already registered') || erro.includes('already exists')) {
    return 'Este e-mail já possui uma conta. Tente entrar ou recuperar a senha.'
  }
  if (erro.includes('password')) return 'A senha não atende aos requisitos de segurança.'
  if (erro.includes('email')) return 'Digite um endereço de e-mail válido.'
  return 'Não foi possível criar a conta. Tente novamente.'
}

function Login() {
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')

  function alternarModo() {
    setModo((atual) => (atual === 'entrar' ? 'criar' : 'entrar'))
    setSenha('')
    setConfirmacaoSenha('')
    setMostrarSenha(false)
    setErro('')
    setAviso('')
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')
    setAviso('')

    if (!supabase) {
      setErro('O Supabase ainda não foi configurado neste ambiente.')
      return
    }

    if (modo === 'criar') {
      if (senha !== confirmacaoSenha) {
        setErro('As senhas informadas não são iguais.')
        return
      }
      if (senha.length < 12 || !/[a-z]/.test(senha) || !/[A-Z]/.test(senha) || !/[0-9]/.test(senha)) {
        setErro('Use pelo menos 12 caracteres, com letra maiúscula, minúscula e número.')
        return
      }
    }

    setProcessando(true)
    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
        })
        if (error) throw error
        if (!data.session) {
          setAviso('Conta criada. Confira seu e-mail para confirmar o cadastro antes de entrar.')
        }
      }
    } catch (falha) {
      const mensagem = falha instanceof Error ? falha.message : ''
      setErro(
        modo === 'criar'
          ? mensagemCadastro(mensagem)
          : 'Não foi possível entrar. Confira o e-mail e a senha.',
      )
    } finally {
      setProcessando(false)
    }
  }

  async function recuperarSenha() {
    setErro('')
    setAviso('')
    if (!email.trim()) {
      setErro('Informe o e-mail para solicitar a recuperação de senha.')
      return
    }
    if (!supabase) {
      setErro('O Supabase ainda não foi configurado neste ambiente.')
      return
    }

    setProcessando(true)
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    setAviso('Se o endereço estiver cadastrado, as instruções serão enviadas por e-mail.')
    setProcessando(false)
  }

  const criandoConta = modo === 'criar'

  return (
    <main className="pagina-login">
      <section className="painel-login" aria-labelledby="titulo-login">
        <div className="login-identidade">
          <div className="login-marca"><img src="/logo-appa.png" alt="" /><div><strong>APPA</strong><span>Gestão interna</span></div></div>
          <div className="login-apresentacao"><span>Área restrita</span><h1>Gestão do Projeto Castração</h1><p>Ambiente de trabalho dos voluntários da ONG.</p></div>
          <p className="login-seguranca">A sessão é encerrada ao fechar esta janela do navegador.</p>
        </div>

        <div className="login-conteudo">
          <div className="login-cabecalho">
            <span className="login-etiqueta">{criandoConta ? 'Novo cadastro' : 'Acesso de voluntários'}</span>
            <h2 id="titulo-login">{criandoConta ? 'Crie sua conta' : 'Entre na sua conta'}</h2>
            <p>{criandoConta ? 'Cadastre seu e-mail e escolha uma senha para começar.' : 'Use o e-mail e a senha cadastrados.'}</p>
          </div>

          {!supabaseConfigurado && <div className="login-configuracao" role="status">Configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> no arquivo <code>.env.local</code>.</div>}

          <form className="login-formulario" onSubmit={enviar}>
            <div className="login-campo"><label htmlFor="login-email">E-mail</label><input id="login-email" name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="voluntario@exemplo.com" disabled={processando || !supabaseConfigurado} required /></div>

            <div className="login-campo">
              <div className="login-label-senha"><label htmlFor="login-senha">Senha</label>{!criandoConta && <button type="button" className="login-link" onClick={recuperarSenha} disabled={processando || !supabaseConfigurado}>Esqueci minha senha</button>}</div>
              <div className="login-senha-input"><input id="login-senha" name="senha" type={mostrarSenha ? 'text' : 'password'} autoComplete={criandoConta ? 'new-password' : 'current-password'} value={senha} onChange={(event) => setSenha(event.target.value)} placeholder={criandoConta ? 'Mínimo de 12 caracteres' : 'Digite sua senha'} disabled={processando || !supabaseConfigurado} minLength={criandoConta ? 12 : undefined} required /><button type="button" className="login-mostrar-senha" onClick={() => setMostrarSenha((valor) => !valor)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={mostrarSenha}>{mostrarSenha ? 'Ocultar' : 'Mostrar'}</button></div>
            </div>

            {criandoConta && <div className="login-campo"><label htmlFor="login-confirmar-senha">Confirmar senha</label><div className="login-senha-input"><input id="login-confirmar-senha" name="confirmacaoSenha" type={mostrarSenha ? 'text' : 'password'} autoComplete="new-password" value={confirmacaoSenha} onChange={(event) => setConfirmacaoSenha(event.target.value)} placeholder="Digite a senha novamente" disabled={processando || !supabaseConfigurado} minLength={12} required /><button type="button" className="login-mostrar-senha" onClick={() => setMostrarSenha((valor) => !valor)} aria-label={mostrarSenha ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'} aria-pressed={mostrarSenha}>{mostrarSenha ? 'Ocultar' : 'Mostrar'}</button></div></div>}

            {erro && <p className="login-mensagem login-erro" role="alert">{erro}</p>}
            {aviso && <p className="login-mensagem login-aviso" role="status">{aviso}</p>}

            <button type="submit" className="login-botao" disabled={processando || !supabaseConfigurado}>{processando ? (criandoConta ? 'Criando conta…' : 'Entrando…') : criandoConta ? 'Criar conta' : 'Entrar'}</button>
          </form>

          <p className="login-ajuda">{criandoConta ? 'Já possui uma conta? ' : 'Ainda não possui conta? '}<button type="button" className="login-alternar" onClick={alternarModo} disabled={processando}>{criandoConta ? 'Entrar' : 'Criar conta'}</button></p>
        </div>
      </section>
    </main>
  )
}

export function RedefinirSenha({ onConcluido }: { onConcluido: () => void }) {
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState('')

  async function redefinir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')

    if (senha !== confirmacao) {
      setErro('As senhas informadas não são iguais.')
      return
    }
    if (senha.length < 12 || !/[a-z]/.test(senha) || !/[A-Z]/.test(senha) || !/[0-9]/.test(senha)) {
      setErro('Use pelo menos 12 caracteres, com letra maiúscula, minúscula e número.')
      return
    }
    if (!supabase) return

    setProcessando(true)
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) {
      setErro('Não foi possível atualizar a senha. Solicite um novo link.')
      setProcessando(false)
      return
    }

    await supabase.auth.signOut()
    onConcluido()
  }

  return (
    <main className="pagina-login">
      <section className="painel-login" aria-labelledby="titulo-redefinir-senha">
        <div className="login-identidade">
          <div className="login-marca"><img src="/logo-appa.png" alt="" /><div><strong>APPA</strong><span>Gestão interna</span></div></div>
          <div className="login-apresentacao"><span>Área restrita</span><h1>Gestão do Projeto Castração</h1><p>Ambiente de trabalho dos voluntários da ONG.</p></div>
        </div>
        <div className="login-conteudo">
          <div className="login-cabecalho"><span className="login-etiqueta">Recuperação de acesso</span><h2 id="titulo-redefinir-senha">Crie uma nova senha</h2><p>Escolha uma senha diferente da anterior.</p></div>
          <form className="login-formulario" onSubmit={redefinir}>
            <div className="login-campo"><label htmlFor="nova-senha">Nova senha</label><div className="login-senha-input"><input id="nova-senha" type={mostrar ? 'text' : 'password'} autoComplete="new-password" value={senha} onChange={(event) => setSenha(event.target.value)} minLength={12} required /><button type="button" className="login-mostrar-senha" onClick={() => setMostrar((valor) => !valor)}>{mostrar ? 'Ocultar' : 'Mostrar'}</button></div></div>
            <div className="login-campo"><label htmlFor="confirmar-nova-senha">Confirmar nova senha</label><input id="confirmar-nova-senha" type={mostrar ? 'text' : 'password'} autoComplete="new-password" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} minLength={12} required /></div>
            {erro && <p className="login-mensagem login-erro" role="alert">{erro}</p>}
            <button type="submit" className="login-botao" disabled={processando}>{processando ? 'Atualizando…' : 'Atualizar senha'}</button>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Login
