# Repo Graph - MVP

Ferramenta para visualizar as relações de dependências entre projetos em um monorepo, similar ao NX Graph.

## 📋 Características

- ✅ Scan recursivo de diretórios em busca de `package.json`
- ✅ Análise de dependências entre projetos
- ✅ API REST com Hono
- ✅ Visualização interativa com Cytoscape.js
- ✅ Interface web moderna
- ✅ Sidebar com lista de projetos

## 🚀 Como usar

### Instalação

```bash
# Instalar dependências
npm install

# Ou com yarn/pnpm
yarn install
pnpm install
```

### Desenvolvimento

```bash
npm run dev
```

A aplicação abrirá em `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

## 🔧 Estrutura do Projeto

```
repo-graph/
├── src/
│   ├── index.ts       # Servidor Hono
│   └── scanner.ts     # Lógica de scan e análise
├── public/
│   └── index.html     # Interface frontend
├── dist/              # Build compilado (após npm run build)
├── package.json
└── tsconfig.json
```

## 📡 API Endpoints

### GET `/api/graph`

Retorna o grafo de dependências.

**Query Parameters:**
- `root` (opcional): Caminho raiz para escanear (padrão: cwd)

**Response:**
```json
{
  "nodes": [
    { "id": "projeto-a", "label": "projeto-a", "path": "packages/a" },
    { "id": "projeto-b", "label": "projeto-b", "path": "packages/b" }
  ],
  "edges": [
    { "source": "projeto-a", "target": "projeto-b" }
  ],
  "projects": [
    {
      "id": "projeto-a",
      "name": "projeto-a",
      "path": "packages/a",
      "dependencies": ["projeto-b", "lodash"]
    }
  ]
}
```

### GET `/health`

Health check da API.

## 🎨 Interface Web

- **Grafo interativo**: Visualização das dependências com Cytoscape.js
- **Layout automático**: Posicionamento inteligente dos nós
- **Sidebar**: Lista de todos os projetos com contagem de dependências
- **Seleção**: Clique nos projetos para destacá-los no grafo
- **Caminho customizado**: Especifique um diretório raiz diferente

## 🔮 Próximos Passos (Futuros)

- Detalhes das dependências ao clicar
- Filtros por tipo de dependência
- Export do grafo (PNG, SVG)
- Análise de ciclos de dependência
- Performance otimizada para repos muito grandes
- Temas customizáveis
- Estatísticas e métricas do monorepo

## 📦 Dependências

- **hono**: Framework web moderno
- **fast-glob**: Glob pattern matching performático
- **cytoscape.js**: Biblioteca de grafos e visualização
- **typescript**: TypeScript para desenvolvimento type-safe

## 📝 Licença

MIT
