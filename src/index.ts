import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { scanMonorepo } from './scanner';

const app = new Hono();

// Servir arquivos estáticos
app.use('/*', serveStatic({ root: './public' }));

// API endpoint para obter o grafo de dependências
app.get('/api/graph', async (c) => {
  try {
    const rootPath = c.req.query('root') || process.cwd();
    const graph = await scanMonorepo(rootPath);
    return c.json(graph);
  } catch (error) {
    return c.json({ error: 'Erro ao processar monorepo' }, 500);
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

export default app;
