# DevTrack: rodar, publicar e instalar como app

## Como o projeto funciona agora

Um **único serviço**: o Express entrega a API (`/api/...`) e também o site já compilado
(`frontend/dist`). Não tem CORS nem URL de API para configurar em produção.

## Rodar no seu computador

**Desenvolvimento** (dois terminais, com recarga automática):

```bash
# terminal 1
cd backend && npm install && npm run dev      # API em :3000

# terminal 2
cd frontend && npm install && npm run dev     # site em :5173 (o Vite repassa /api para :3000)
```

**Simulando produção** (um serviço só):

```bash
cd frontend && npm ci && npm run build
cd ../backend && npm ci && npm start          # tudo em http://localhost:3000
```

## SQLite é uma limitação?

Para um app de uso pessoal/pequeno, **não**: é rápido e simples. O que importa é *onde o arquivo
do banco fica guardado*:

- Hospedagens "serverless" ou com disco temporário (Vercel, Netlify, planos gratuitos sem disco)
  **apagam o arquivo a cada deploy/reinício**. Não use essas para o backend.
- Use uma hospedagem com **disco/volume persistente** e aponte `DB_PATH` para ele.
- Rode **uma única instância** (SQLite não é feito para vários servidores escrevendo no mesmo arquivo).

Se um dia precisar de várias instâncias ou muitos usuários, o caminho é migrar para Postgres
(ou Turso/libSQL, que é compatível com SQLite).

## Variáveis de ambiente

| Variável     | Para quê                                   | Padrão                         |
|--------------|--------------------------------------------|--------------------------------|
| `JWT_SECRET` | Assina o login. **Defina uma só sua.**     | gerado e salvo ao lado do banco |
| `DB_PATH`    | Caminho do arquivo SQLite                  | `backend/database/devtrack.db` |
| `PORT`       | Porta do servidor                          | `3000` (o Docker já define)    |

Gere um segredo com: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

## Publicar com Docker (serve para qualquer hospedagem)

O `Dockerfile` da raiz faz tudo: compila o site, instala o backend e guarda o banco em `/data`.
**Monte um volume/disco persistente em `/data`.**

### Opção A: Fly.io (tem volumes)

```bash
fly launch --no-deploy                     # detecta o Dockerfile; porta interna 3000
fly volumes create devtrack_data --size 1
fly secrets set JWT_SECRET="cole-o-segredo-aqui"
```

No `fly.toml` gerado, adicione:

```toml
[mounts]
  source = "devtrack_data"
  destination = "/data"
```

e rode `fly deploy`. Mantenha 1 máquina só (`fly scale count 1`).

### Opção B: Railway ou Render

Crie um serviço a partir do repositório (ele usa o `Dockerfile`), adicione um **Volume/Disk**
montado em `/data` e defina `JWT_SECRET` nas variáveis. Confira nos sites o que cada plano
inclui hoje: o disco persistente costuma exigir plano pago.

### Opção C: VPS próprio

```bash
git clone <seu-repositorio> && cd DevTrack
# edite JWT_SECRET no docker-compose.yml
docker compose up -d --build
```

Coloque um proxy com HTTPS na frente (Caddy ou Nginx), porque o app instalável exige HTTPS.

## Instalar como app (PC e celular)

O DevTrack é um **PWA**: depois de publicado em HTTPS, quem abrir o site pode instalar.

- **Chrome/Edge (PC e Android):** botão **Instalar app** dentro do DevTrack (menu lateral no PC,
  aba Perfil no celular) ou o ícone de instalação na barra de endereço.
- **iPhone/iPad (Safari):** Compartilhar → **Adicionar à Tela de Início**.

Importante: os dados continuam no servidor. O app instalado abre rápido, mas **precisa de internet
para carregar e salvar estudos**. Para funcionar 100% offline com banco local no aparelho, seria
preciso outra arquitetura (dados no próprio dispositivo, por exemplo IndexedDB/SQLite no app com
Capacitor ou Tauri) e depois sincronizar com a conta. Dá para evoluir para isso mais adiante.

## Backup do banco

Todo o seu dado é o arquivo `devtrack.db` (em `/data`). Faça cópias periódicas, por exemplo
`fly ssh sftp get /data/devtrack.db` ou `docker cp`. Se o app estiver rodando, copie também
os arquivos `-wal` e `-shm` junto, ou use `sqlite3 devtrack.db ".backup copia.db"`.

## Mudanças que afetam quem já usava

- As rotas da API agora ficam sob `/api` (`/api/auth/login`, `/api/studies`...).
- O segredo do JWT deixou de estar fixo no código: quem estava logado precisará entrar de novo uma vez.
- O banco existente em `backend/database/devtrack.db` continua sendo usado em desenvolvimento.
