import glob from 'fast-glob';
import { readFileSync } from 'fs';
import { join, relative } from 'path';

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface Project {
  id: string;
  name: string;
  path: string;
  dependencies: string[];
}

interface GraphData {
  nodes: Array<{ id: string; label: string; path: string }>;
  edges: Array<{ source: string; target: string }>;
  projects: Project[];
}

export async function scanMonorepo(rootPath: string): Promise<GraphData> {
  // Encontrar todos os package.json
  const packageFiles = await glob('**/package.json', {
    cwd: rootPath,
    ignore: ['node_modules/**', '.git/**', 'dist/**'],
    absolute: false,
  });

  const projects: Project[] = [];
  const projectMap = new Map<string, Project>();

  // Ler e processar cada package.json
  for (const filePath of packageFiles) {
    const fullPath = join(rootPath, filePath);
    const dirPath = filePath.split('/').slice(0, -1).join('/') || '.';

    try {
      const content = readFileSync(fullPath, 'utf-8');
      const pkg = JSON.parse(content) as PackageJson;

      if (!pkg.name) continue;

      const project: Project = {
        id: pkg.name,
        name: pkg.name,
        path: dirPath,
        dependencies: [],
      };

      // Coletar dependências (filtrando para incluir apenas projetos do monorepo)
      const allDeps = [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
      ];

      project.dependencies = allDeps;
      projects.push(project);
      projectMap.set(pkg.name, project);
    } catch (error) {
      console.error(`Erro ao processar ${fullPath}:`, error);
    }
  }

  // Construir nodes e edges do grafo
  const nodes = projects.map((p) => ({
    id: p.id,
    label: p.name,
    path: p.path,
  }));

  const edges: Array<{ source: string; target: string }> = [];
  const projectNames = new Set(projects.map((p) => p.id));

  for (const project of projects) {
    for (const dep of project.dependencies) {
      if (projectNames.has(dep)) {
        edges.push({
          source: project.id,
          target: dep,
        });
      }
    }
  }

  return {
    nodes,
    edges,
    projects,
  };
}
