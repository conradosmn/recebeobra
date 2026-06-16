# Recebimento Provisório - Anexo III

App temporário para registro fotográfico do recebimento provisório de obra (TCE-PI).
Login só por email autorizado (sem senha). Cada usuário fotografa, descreve e gera seu PDF.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind 4 · Supabase (service_role, server-side) · jsPDF

## Como funciona
- **Login**: digita o email. Se estiver cadastrado em `usuarios_permitidos`, entra (cookie assinado de 7 dias).
- **Obras**: lista as obras. O usuário entra na obra e faz os registros.
- **Registro**: foto pela câmera do celular (comprimida no navegador) + descrição. Salva no Supabase.
- **PDF**: botão "Gerar PDF" baixa um PDF com a logo no cabeçalho e cada foto + descrição.
- **Admin** (`conrado.machado@tce.pi.gov.br`): cadastra/remove emails e cria/remove obras.

## Setup (1ª vez)

### 1. Banco (Supabase)
1. Crie um projeto novo em https://supabase.com.
2. SQL Editor → cole e rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
   (Já cria o admin `conrado.machado@tce.pi.gov.br`.)

### 2. Variáveis de ambiente
Copie `.env.local.example` para `.env.local` e preencha:
- `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` → Supabase → Project Settings → API
- `SESSION_SECRET` → gere com:
  ```
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### 3. Logo
Salve a logo vertical do TCE-PI em `public/logo-tce.png` (veja `public/LEIA-logo.txt`).

### 4. Rodar
```
npm install
npm run dev        # http://localhost:3000
```

## Deploy (subdomínio)
Funciona out-of-the-box na **Vercel** ou **Netlify**:
1. Suba o projeto para um repositório Git.
2. Importe na Vercel/Netlify e configure as 3 variáveis de ambiente acima.
3. Aponte o subdomínio desejado para o deploy nas configurações de domínio.

## Segurança (importante)
Login só por email, sem senha — por desenho, é simples e temporário. Quem souber um
email autorizado consegue entrar. Adequado para um evento pontual; **não** use para
dados sensíveis de longo prazo. Ao terminar, basta apagar o projeto Supabase.
