import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { spawn } from 'bun';
import { scanMonorepo, clearPackageCache, getCacheStats, scanMonorepoFinderProjects } from './scanner';
import { join, parse } from 'path';
import { Eta } from 'eta'
import path from 'path'

const app = new Hono();
const eta = new Eta({ views: path.join(__dirname, 'view') })

// Servir arquivos estáticos
app.use('/*', serveStatic({ root: './public' }));

app.get('/cache', async (c) => {
  const cache = getCacheStats();
  const template = eta.render('./cache', { cacheObj: cache });
  return c.html(template);
});

app.post('/api/findError', async (c) => {
console.log('Recebida solicitação para /api/findError');
  const ollama = await callOllama(`
    Você pode solicitar ferramentas quando necessário. 

    Ferramentas disponíveis:
    - getCrashDetails: Use esta ferramenta para encontrar erros em projetos TypeScript. 
    Retorne o nome do projeto e o erro encontrado.

    Responda apenas no formato JSON:
    {
      "tool": "getCrashDetails",
      "args": {
        "crashId": "nome-do-projeto"
      }
    }
    `);

    let parsed;
    console.log(ollama.response);
    try {
      const normalize = ollama.response.replace("```json", '').replace("```", '').trim();
      parsed = JSON.parse(normalize);
    } catch {
      return c.json({ error: 'Resposta do Ollama não está em formato JSON válido.' }, 500);
    }

    if (parsed.tool === 'getCrashDetails') {
      try {
        const toolResult = await fetch(`http://localhost:3001/mcp`, 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json,text/event-stream' },
          body: JSON.stringify({
            // jsonrpc: "2.0",
            // id: 1,
            // method: "tools/call",
            tool: "getCrashDetails",
            params: {
              name: "getCrashDetails",
              arguments: {crashId: parsed.args.crashId}
            }
          })
        }
      ).then(res => res.json());

      console.log('Resultado da ferramenta getCrashDetails:', toolResult);

      const final = await callOllama(`
        O usuário solicitou detalhes sobre o erro no projeto ${parsed.args.crashId}.

        Aqui estão os detalhes do erro:
        ${toolResult.result}

        Forneça uma explicação clara e concisa do erro encontrado neste projeto TypeScript.
      `);

      return c.json({ result: final.response });
      // return c.json({ result: toolResult });
      } catch (error) {
        console.error('Erro ao chamar a ferramenta getCrashDetails:', error);
        return c.json({ error: 'Erro ao chamar a ferramenta getCrashDetails.' }, 500);
      }
    }

    return c.json({ error: 'Ferramenta desconhecida solicitada.' }, 500);

});

async function callOllama(prompt: string) {
  const res = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemma',
      prompt,
      stream: false,
      options: {
        temperature: 0.4,
      }
    })
  })

  return res.json()
}

// API endpoint para obter o grafo de dependências
app.get('/api/graph', async (c) => {
  try {
    const rootPath = c.req.query('root') || process.cwd();
    const maxDepth = parseInt(c.req.query('maxDepth') || '3');
    const maxFiles = parseInt(c.req.query('maxFiles') || '200');
    const useCache = c.req.query('useCache') !== 'false';
    const filterProjects = c.req.query('filter')?.split(',').filter(Boolean) || [];
    
    const graph = await scanMonorepo(rootPath, {
      maxDepth,
      maxFiles,
      useCache,
      filterProjects,
    });
    
    return c.json(graph);
  } catch (error) {
    return c.json({ error: 'Erro ao processar monorepo' }, 500);
  }
});

app.get('/api/find', async (c) => {
  try {
    const rootPath = c.req.query('root') || process.cwd();
    const maxDepth = parseInt(c.req.query('maxDepth') || '3');
    const maxFiles = parseInt(c.req.query('maxFiles') || '200');
    const useCache = c.req.query('useCache') !== 'false';
    const filterProjects = c.req.query('filter')?.split(',').filter(Boolean) || [];
    
    const graph = await scanMonorepoFinderProjects(rootPath, {
      maxDepth,
      maxFiles,
      useCache,
      filterProjects,
    });
    
    return c.json(graph);
  } catch (error) {
    return c.json({ error: 'Erro ao processar monorepo' }, 500);
  }
});

// Endpoint para limpar cache
app.post('/api/cache/clear', (c) => {
  clearPackageCache();
  return c.json({ message: 'Cache limpo com sucesso' });
});

// Endpoint para ver estatísticas do cache
app.get('/api/cache/stats', (c) => {
  return c.json(getCacheStats());
});

// Endpoint para abrir caminho no VS Code
app.post('/api/open', async (c) => {
  try {
    const { path, rootPath } = await c.req.json();
    if (!path) {
      return c.json({ error: 'Path é obrigatório' }, 400);
    }

    // Executar comando code no terminal
    const proc = spawn(['code', join(rootPath, path)], {
      cwd: process.cwd(),
      stdout: 'pipe',
      stderr: 'pipe',
    });

    await proc.exited;
    
    return c.json({ success: true, message: `VS Code aberto em: ${path}` });
  } catch (error: any) {
    return c.json({ error: `Erro ao abrir VS Code: ${error.message}` }, 500);
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

export default {
  port: 3002,
  fetch: app.fetch,
};
