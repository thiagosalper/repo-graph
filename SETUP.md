# Repo Graph MVP

## ✨ MVP Completo do Projeto

### 🎯 Backend (Hono API)
- **src/index.ts**: Servidor Hono com endpoints REST
- **src/scanner.ts**: Engine de scan com fast-glob que encontra todos os package.json e analisa dependências

### 🎨 Frontend (Cytoscape.js)
- **public/index.html**: Interface interativa com tema escuro (GitHub-style)
- Grafo dinâmico com layout automático
- Sidebar para navegar entre projetos
- Campo para customizar o diretório raiz

### 📦 Configuração
- **package.json**: Dependências minimais (hono, fast-glob)
- **tsconfig.json**: TypeScript configurado
- Scripts prontos para dev/build/start

## 🚀 Como Começar

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Inicie em desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Acesse em seu navegador:**
   ```
   http://localhost:3000
   ```

4. **Use a ferramenta:**
   - Deixe o campo de caminho vazio para usar o diretório atual
   - Ou especifique um caminho completo
   - Clique em "Carregar Grafo"
   - Visualize as dependências e interaja com o grafo

## 📊 O que o MVP Faz

✅ Escaneia recursivamente todos os package.json do projeto
✅ Identifica dependências entre projetos (workspace dependencies)
✅ Filtra apenas dependências internas (do monorepo)
✅ Gera um grafo direcionado com os relacionamentos
✅ Visualiza tudo de forma interativa e bonita
✅ API REST para integração com outros tools

## 🎨 Personalização Futura

O projeto está estruturado para permitir:
- Novos layouts de grafo
- Filtros por tipo de dependência
- Análise de ciclos
- Export de visualizações
- Temas customizáveis
