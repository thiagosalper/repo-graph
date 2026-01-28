import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { spawn } from 'bun';
import { scanMonorepo, clearPackageCache, getCacheStats, scanMonorepoFinderProjects } from './scanner';
import { join } from 'path';

const app = new Hono();

// Servir arquivos estáticos
app.use('/*', serveStatic({ root: './public' }));

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

export default app;
