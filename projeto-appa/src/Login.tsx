import { useState } from 'react'
import type { FormEvent } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import type { CredentialResponse } from '@react-oauth/google'
import { FirebaseError } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import {
  auth,
  firebaseConfigurado,
  persistenciaConfigurada,
} from './firebase'
import './Login.css'

type Modo = 'entrar' | 'criar'

function mensagemDeErroNoCadastro(erro: unknown) {
  if (!(erro instanceof FirebaseError)) {
    return 'Não foi possível criar a conta. Tente novamente.'
  }

  switch (erro.code) {
    case 'auth/email-already-in-use':
      return 'Este e-mail já pode ter uma conta. Tente entrar ou recuperar a senha.'
    case 'auth/invalid-email':
      return 'Digite um endereço de e-mail válido.'
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return 'A senha não atende aos requisitos definidos no Firebase. Tente uma senha mais forte.'
    case 'auth/admin-restricted-operation':
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'O cadastro está desativado no Firebase. Ative o acesso por E-mail/senha e permita a criação de contas no Console do Firebase.'
    case 'auth/network-request-failed':
      return 'Não foi possível conectar ao Firebase. Verifique sua internet e tente novamente.'
    case 'auth/too-many-requests':
    case 'auth/quota-exceeded':
      return 'Muitas tentativas foram realizadas. Aguarde alguns minutos e tente novamente.'
    case 'auth/invalid-api-key':
    case 'auth/app-not-authorized':
    case 'auth/invalid-app-id':
      return 'A configuração do Firebase não foi aceita. Confira os dados do aplicativo em .env.local.'
    default:
      return `Não foi possível criar a conta. Código do Firebase: ${erro.code}.`
  }
}

function mensagemDeErroNoGoogle(erro: unknown) {
  if (!(erro instanceof FirebaseError)) {
    return 'Não foi possível entrar com o Google. Tente novamente.'
  }

  switch (erro.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'A entrada com Google foi cancelada.'
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela do Google. Permita pop-ups e tente novamente.'
    case 'auth/operation-not-allowed':
      return 'O login com Google está desativado. Habilite o provedor Google no Console do Firebase.'
    case 'auth/unauthorized-domain':
      return 'Este domínio não está autorizado no Firebase Authentication.'
    case 'auth/account-exists-with-different-credential':
      return 'Já existe uma conta com este e-mail usando senha. Entre com e-mail e senha.'
    case 'auth/network-request-failed':
      return 'Não foi possível conectar ao Google. Verifique sua internet e tente novamente.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas foram realizadas. Aguarde alguns minutos e tente novamente.'
    default:
      return `Não foi possível entrar com o Google. Código do Firebase: ${erro.code}.`
  }
}

function Login() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const googleConfigurado = Boolean(
    googleClientId && googleClientId !== 'SEU_CLIENT_ID',
  )
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

    if (!auth || !firebaseConfigurado) {
      setErro('O Firebase ainda não foi configurado neste ambiente.')
      return
    }

    if (modo === 'criar') {
      if (senha !== confirmacaoSenha) {
        setErro('As senhas informadas não são iguais.')
        return
      }

      if (
        senha.length < 12 ||
        !/[a-z]/.test(senha) ||
        !/[A-Z]/.test(senha) ||
        !/[0-9]/.test(senha)
      ) {
        setErro(
          'Use pelo menos 12 caracteres, com letra maiúscula, minúscula e número.',
        )
        return
      }
    }

    setProcessando(true)

    if (modo === 'entrar') {
      try {
        await persistenciaConfigurada
        await signInWithEmailAndPassword(auth, email.trim(), senha)
      } catch {
        setErro('Não foi possível entrar. Confira o e-mail e a senha.')
      } finally {
        setProcessando(false)
      }
      return
    }

    try {
      await persistenciaConfigurada
      await createUserWithEmailAndPassword(auth, email.trim(), senha)
    } catch (erro) {
      setErro(mensagemDeErroNoCadastro(erro))
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

    if (!auth || !firebaseConfigurado) {
      setErro('O Firebase ainda não foi configurado neste ambiente.')
      return
    }

    setProcessando(true)

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setAviso(
        'Se o endereço estiver cadastrado, as instruções serão enviadas por e-mail.',
      )
    } catch {
      setAviso(
        'Se o endereço estiver cadastrado, as instruções serão enviadas por e-mail.',
      )
    } finally {
      setProcessando(false)
    }
  }

  async function entrarComGoogle(credentialResponse: CredentialResponse) {
    setErro('')
    setAviso('')

    const tokenGoogle = credentialResponse.credential

    console.log('Google JWT:', tokenGoogle)

    if (!tokenGoogle) {
      setErro('O Google não retornou uma credencial válida. Tente novamente.')
      return
    }

    if (!auth || !firebaseConfigurado) {
      setErro('O Firebase ainda não foi configurado neste ambiente.')
      return
    }

    setProcessando(true)

    try {
      await persistenciaConfigurada
      const credencialFirebase = GoogleAuthProvider.credential(tokenGoogle)
      await signInWithCredential(auth, credencialFirebase)
    } catch (erro) {
      setErro(mensagemDeErroNoGoogle(erro))
    } finally {
      setProcessando(false)
    }
  }

  function erroNoLoginGoogle() {
    console.error('Não foi possível concluir o login com Google.')
    setErro('Não foi possível concluir o login com Google. Tente novamente.')
  }

  const criandoConta = modo === 'criar'

  return (
    <main className="pagina-login">
      <section className="painel-login" aria-labelledby="titulo-login">
        <div className="login-identidade">
          <div className="login-marca">
            <img src="/logo-appa.png" alt="" />
            <div>
              <strong>APPA</strong>
              <span>Gestão interna</span>
            </div>
          </div>

          <div className="login-apresentacao">
            <span>Área restrita</span>
            <h1>Gestão do Projeto Castração</h1>
            <p>Ambiente de trabalho dos voluntários da ONG.</p>
          </div>

          <p className="login-seguranca">
            A sessão é encerrada ao fechar esta janela do navegador.
          </p>
        </div>

        <div className="login-conteudo">
          <div className="login-cabecalho">
            <span className="login-etiqueta">
              {criandoConta ? 'Novo cadastro' : 'Acesso de voluntários'}
            </span>
            <h2 id="titulo-login">
              {criandoConta ? 'Crie sua conta' : 'Entre na sua conta'}
            </h2>
            <p>
              {criandoConta
                ? 'Cadastre seu e-mail e escolha uma senha para começar.'
                : 'Use o e-mail e a senha cadastrados.'}
            </p>
          </div>

          {!firebaseConfigurado && (
            <div className="login-configuracao" role="status">
              Configure as variáveis <code>VITE_FIREBASE_*</code> no arquivo{' '}
              <code>.env.local</code> para liberar o acesso.
            </div>
          )}

          <form className="login-formulario" onSubmit={enviar}>
            <div className="login-campo">
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voluntario@exemplo.com"
                disabled={processando || !firebaseConfigurado}
                required
              />
            </div>

            <div className="login-campo">
              <div className="login-label-senha">
                <label htmlFor="login-senha">Senha</label>
                {!criandoConta && (
                  <button
                    type="button"
                    className="login-link"
                    onClick={recuperarSenha}
                    disabled={processando || !firebaseConfigurado}
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="login-senha-input">
                <input
                  id="login-senha"
                  name="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete={
                    criandoConta ? 'new-password' : 'current-password'
                  }
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder={
                    criandoConta ? 'Mínimo de 12 caracteres' : 'Digite sua senha'
                  }
                  disabled={processando || !firebaseConfigurado}
                  minLength={criandoConta ? 12 : undefined}
                  required
                />
                <button
                  type="button"
                  className="login-mostrar-senha"
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={mostrarSenha}
                >
                  {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {criandoConta && (
              <div className="login-campo">
                <label htmlFor="login-confirmar-senha">Confirmar senha</label>
                <div className="login-senha-input">
                  <input
                    id="login-confirmar-senha"
                    name="confirmacaoSenha"
                    type={mostrarSenha ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmacaoSenha}
                    onChange={(event) =>
                      setConfirmacaoSenha(event.target.value)
                    }
                    placeholder="Digite a senha novamente"
                    disabled={processando || !firebaseConfigurado}
                    minLength={12}
                    required
                  />
                  <button
                    type="button"
                    className="login-mostrar-senha"
                    onClick={() => setMostrarSenha((valor) => !valor)}
                    aria-label={
                      mostrarSenha
                        ? 'Ocultar confirmação de senha'
                        : 'Mostrar confirmação de senha'
                    }
                    aria-pressed={mostrarSenha}
                  >
                    {mostrarSenha ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </div>
            )}

            {erro && (
              <p className="login-mensagem login-erro" role="alert">
                {erro}
              </p>
            )}

            {aviso && (
              <p className="login-mensagem login-aviso" role="status">
                {aviso}
              </p>
            )}

            <button
              type="submit"
              className="login-botao"
              disabled={processando || !firebaseConfigurado}
            >
              {processando
                ? criandoConta
                  ? 'Criando conta…'
                  : 'Entrando…'
                : criandoConta
                  ? 'Criar conta'
                  : 'Entrar'}
            </button>

            <div className="login-divisor" aria-hidden="true">
              <span>ou</span>
            </div>

            {googleConfigurado ? (
              <div
                className={`login-google-container${processando ? ' login-google-desabilitado' : ''}`}
                aria-busy={processando}
              >
                <GoogleLogin
                  onSuccess={entrarComGoogle}
                  onError={erroNoLoginGoogle}
                  useOneTap
                  text="continue_with"
                  shape="rectangular"
                  size="large"
                  width="320"
                />
              </div>
            ) : (
              <p className="login-google-configuracao" role="status">
                Configure <code>VITE_GOOGLE_CLIENT_ID</code> para habilitar o
                acesso com Google.
              </p>
            )}
          </form>

          <p className="login-ajuda">
            {criandoConta ? 'Já possui uma conta? ' : 'Ainda não possui conta? '}
            <button
              type="button"
              className="login-alternar"
              onClick={alternarModo}
              disabled={processando}
            >
              {criandoConta ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Login
