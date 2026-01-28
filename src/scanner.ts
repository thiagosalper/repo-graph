import glob from 'fast-glob';
import { readFileSync } from 'fs';
import { join } from 'path';

const IGNORED_PATHS = ['node_modules/**', '.git/**', 'dist/**', 'build/**', 'coverage/**', 'mov-android-aapf/**', 'mov-ios-aapf/**'];

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface Project {
  id: string;
  name: string;
  version?: string;
  path: string;
  dependencies: string[];
}

interface GraphData {
  nodes: Array<{ id: string; label: string; path: string }>;
  edges: Array<{ source: string; target: string }>;
  projects: Project[];
}

interface ScanOptions {
  maxDepth?: number;
  maxFiles?: number;
  useCache?: boolean;
  filterProjects?: string[]; // Filtrar por nomes de projetos específicos
}

interface ProjectsData {
  find: number;
  proccessed: number;
  projects: Project[];
}

// Cache para evitar reprocessamento
const packageCache = new Map<string, PackageJson>();

export async function scanMonorepo(
  rootPath: string,
  options: ScanOptions = {}
): Promise<GraphData> {
  const {
    maxDepth = 2, // Limita profundidade de busca
    maxFiles = 20, // Limite de arquivos para processar
    useCache = true,
    filterProjects = [], // Filtrar projetos específicos
  } = options;

  // Limpar cache se não estiver usando
  if (!useCache) {
    packageCache.clear();
  }

  // Encontrar todos os package.json com limite de profundidade
  const depthPattern = maxDepth > 0 
    ? `{${Array.from({ length: maxDepth }, (_, i) => '*'.repeat(i + 1)).join(',')}}` 
    : '**';
  
  const packageFiles = await glob(`${depthPattern}/package.json`, {
    cwd: rootPath,
    ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**', 'coverage/**'],
    absolute: false,
    onlyFiles: true,
  });

  // Limitar número de arquivos
  const filesToProcess = packageFiles.slice(0, maxFiles);
  
  if (packageFiles.length > maxFiles) {
    console.warn(`⚠️ Encontrados ${packageFiles.length} package.json, processando apenas ${maxFiles}`);
  }

  const projects: Project[] = [];
  const projectMap = new Map<string, Project>();

  // Ler e processar cada package.json com cache
  for (const filePath of filesToProcess) {
    const fullPath = join(rootPath, filePath);
    const dirPath = filePath.split('/').slice(0, -1).join('/') || '.';

    try {
      let pkg: PackageJson;
      
      // Verificar cache
      if (useCache && packageCache.has(fullPath)) {
        pkg = packageCache.get(fullPath)!;
      } else {
        const content = readFileSync(fullPath, 'utf-8');
        pkg = JSON.parse(content) as PackageJson;
        
        // Armazenar no cache
        if (useCache) {
          packageCache.set(fullPath, pkg);
        }
      }

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

  // Aplicar filtro de projetos se especificado
  let filteredProjects = projects;
  console.log(`🔍 Filtros aplicados: ${filterProjects.join(', ')}`);
  if (filterProjects.length > 0) {
    const filterSet = new Set(filterProjects.map(f => f.toLowerCase()));
    filteredProjects = projects.filter(p => 
      filterSet.has(p.name.toLowerCase()) ||
      filterProjects.some(f => p.name.includes(f))
    );
    console.log(`🔍 Filtrado: ${filteredProjects.length}/${projects.length} projetos`);
  }

  // Construir nodes e edges do grafo
  const nodes = filteredProjects.map((p) => ({
    id: p.id,
    label: p.name,
    path: p.path,
  }));

  const edges: Array<{ source: string; target: string }> = [];
  const projectNames = new Set(filteredProjects.map((p) => p.id));

  for (const project of filteredProjects) {
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
    projects: filteredProjects,
  };
}

export async function scanMonorepoFinderProjects(
  rootPath: string,
  options: ScanOptions = {}
): Promise<ProjectsData> {
  const { maxDepth = 2, maxFiles = 20, useCache = true, filterProjects = [] } = options;
  if (!useCache) packageCache.clear();

  const depthPattern = checkMaxDepthPattern(maxDepth);
  
  const packageFiles = await glob(`${depthPattern}/package.json`, {
    cwd: rootPath,
    ignore: IGNORED_PATHS,
    absolute: false,
    onlyFiles: true,
  });

  // Limitar número de arquivos
  const filesToProcess = packageFiles.slice(0, maxFiles);
  let projectDataResponse: ProjectsData = {
    find: packageFiles.length,
    proccessed: filesToProcess.length,
    projects: [],
  };

  const projects: Project[] = [];
  const projectMap = new Map<string, Project>();

  for (const filePath of filesToProcess) {   // Ler e processar cada package.json com cache
    const fullPath = join(rootPath, filePath);
    const dirPath = filePath.split('/').slice(0, -1).join('/') || '.';

    try {
      let pkg: PackageJson;
      
      if (useCache && packageCache.has(fullPath)) { // Verificar cache
        pkg = packageCache.get(fullPath)!;
      } else {
        pkg = JSON.parse(readFileSync(fullPath, 'utf-8')) as PackageJson;
        
        if (useCache) packageCache.set(fullPath, pkg); // Armazenar no cache
      }

      if (!pkg.name) continue;

      const project: Project = {
        id: pkg.name,
        version: pkg.version || 'N/A',
        name: pkg.name,
        path: dirPath,
        dependencies: [],
      };

      // Coletar dependências (filtrando para incluir apenas projetos do monorepo)
      const allDeps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {}) ];
    
      project.dependencies = allDeps;
      projects.push(project);
      projectMap.set(pkg.name, project);
    } catch (error) {
      console.error(`Erro ao processar ${fullPath}:`, error);
    }
  }

  let filteredProjects = projects; // Aplicar filtro de projetos se especificado
  if (filterProjects.length > 0) {
    const filterSet = new Set(filterProjects.map(f => f.toLowerCase())); // + performatico 0(1) ... array 0(n)
    filteredProjects = projects.filter(p => 
      filterSet.has(p.name.toLowerCase()) ||
      filterProjects.some(f => p.name.includes(f)) // TODO check duplicado?
    );
  }

  projectDataResponse.projects = filteredProjects;
  return projectDataResponse;
}

// Função para limpar o cache manualmente
export function clearPackageCache(): void {
  packageCache.clear();
  console.log('Cache de package.json limpo');
}

// Função para obter estatísticas do cache
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: packageCache.size,
    entries: Array.from(packageCache.keys()),
  };
}

function hasMaxDepthPattern(maxDepth: number): string {
  return `{${Array.from({ length: maxDepth }, (_, i) => '*'.repeat(i + 1)).join(',')}}`;
}

function checkMaxDepthPattern(maxDepth: number): string {
  return maxDepth > 0 
    ? hasMaxDepthPattern(maxDepth)
    : '**';
}