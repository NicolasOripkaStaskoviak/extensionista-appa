# Configuração do Firebase Authentication

O fluxo atual é simples: qualquer pessoa pode criar uma conta com e-mail e senha
e entra automaticamente no sistema após o cadastro.

## 1. Configurar o aplicativo web

No Firebase Console, registre um aplicativo Web e copie o `firebaseConfig` para
`.env.local`:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_CLIENT_ID=SEU_CLIENT_ID
```

Esses valores identificam o cliente e ficam visíveis no navegador. Eles não são
credenciais administrativas.

## 2. Habilitar cadastro e login

1. Em **Authentication > Sign-in method**, habilite **E-mail/senha**.
2. Na mesma tela, habilite também o provedor **Google** e escolha o e-mail de
   suporte solicitado pelo Firebase.
3. Em **Authentication > Settings > User actions**, permita a criação de contas.
4. Não habilite login anônimo.
5. Mantenha habilitada a proteção contra enumeração de e-mails.
6. Em **Authorized domains**, mantenha somente `localhost` durante o
   desenvolvimento e os domínios reais utilizados em produção.

## 3. Configurar o botão do Google

1. No Google Cloud Console, crie um cliente OAuth 2.0 do tipo **Aplicativo da
   Web** para o mesmo projeto.
2. Adicione `http://localhost:5173` e os endereços reais da aplicação em
   **Origens JavaScript autorizadas**.
3. Copie o Client ID para `VITE_GOOGLE_CLIENT_ID` no `.env.local`.
4. Reinicie o servidor de desenvolvimento após alterar o arquivo de ambiente.

## 4. Proteção futura dos dados

O login identifica o usuário, mas a tela do navegador não substitui regras de
segurança. Quando banco de dados, armazenamento ou backend forem adicionados:

1. exija um usuário autenticado em todas as operações privadas;
2. valide o ID token do Firebase no backend;
3. obtenha o `uid` somente do token validado;
4. nunca aceite um `uid` enviado pelo formulário como prova de identidade;
5. configure regras próprias para Firestore ou Firebase Storage.

## 5. Credenciais proibidas no repositório

Nunca publique arquivos de service account, chaves privadas, `private_key`,
`client_email` administrativo, tokens de CI/CD ou senhas. O `.gitignore` já cobre
os nomes mais comuns, mas uma credencial exposta deve ser revogada imediatamente.
