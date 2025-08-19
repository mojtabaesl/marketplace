import { Tree, getProjects, type ProjectConfiguration } from '@nx/devkit';
import { createProjectGraphAsync } from '@nx/devkit';
import { SyncGeneratorResult } from 'nx/src/utils/sync-generators';
import * as path from 'path';
import type { UpdateTailwindGlobsGeneratorSchema as Schema } from './schema.d';

// Version-agnostic context shape (older Nx may not export GeneratorContext)
type GeneratorContextLike = { projectName?: string };

export default async function updateTailwindGlobsGenerator(
  tree: Tree,
  schema: Schema = {},
  context?: GeneratorContextLike
): Promise<SyncGeneratorResult> {
  const projectGraph = await createProjectGraphAsync();
  const projects = getProjects(tree);

  // Prefer explicit flag; fallback to invoking project; final fallback env hints
  const projectName = resolveProjectName(schema.project, context);

  const targets = getTargetProjects(tree, projects, {
    ...schema,
    project: projectName,
  });

  if (targets.length === 0) {
    return {
      outOfSyncMessage: projectName
        ? `No Tailwind stylesheet found for project "${projectName}".`
        : 'No Tailwind-enabled apps were found.',
    };
  }

  let changedCount = 0;

  for (const t of targets) {
    const deps = collectTransitiveDeps(projectGraph, t.name);
    const sources = buildSourceDirectives(
      projectGraph,
      deps,
      t.stylesFsPath,
      t.name
    );

    const css = readCss(tree, t.stylesFsPath);

    if (!hasTailwindImport(css)) continue;

    const existing = parseExistingSourceDirectives(css);

    if (!needsUpdate(existing, sources)) continue;

    const cleaned = removeExistingSourceDirectives(css);
    const nextCss = insertSourcesAfterTailwindImport(cleaned, sources);

    writeCss(tree, t.stylesFsPath, nextCss);
    changedCount++;
  }

  return changedCount
    ? {
        outOfSyncMessage: `Tailwind @source directives updated for ${changedCount} project(s).`,
      }
    : {};
}

/* -------------------------- option resolution -------------------------- */

function resolveProjectName(
  schemaProject: string | undefined,
  context?: GeneratorContextLike
): string | undefined {
  // 1) explicit CLI flag wins
  if (schemaProject) return schemaProject;

  // 2) Nx context (syncGenerators / invoked from a project)
  if (context?.projectName) return context.projectName;

  // 3) last-ditch env hints (some Nx tasks expose this)
  const envTarget =
    process.env.NX_TASK_TARGET_PROJECT ||
    process.env.NX_WORKSPACE_TARGET_PROJECT ||
    process.env.TARGET_NAME; // very rare, but harmless
  return envTarget || undefined;
}

/* -------------------------- helpers: discovery -------------------------- */

function getTargetProjects(
  tree: Tree,
  projects: Map<string, ProjectConfiguration>,
  schema: Schema
): Array<{ name: string; config: ProjectConfiguration; stylesFsPath: string }> {
  const out: Array<{
    name: string;
    config: ProjectConfiguration;
    stylesFsPath: string;
  }> = [];

  for (const [name, config] of projects.entries()) {
    if (schema.project && name !== schema.project) continue; // explicit filter if provided
    if (!isLikelyWebApp(config)) continue;

    const styles = resolveStylesPath(tree, config, schema.stylesPath);
    if (styles) out.push({ name, config, stylesFsPath: styles });
  }

  return out;
}

function isLikelyWebApp(config: ProjectConfiguration): boolean {
  const t = config.targets ?? {};
  // Heuristic: has serve/build typical for web apps (vite/webpack/next or generic)
  return Boolean(
    t.serve ||
      t.build ||
      t['@nx/vite:build'] ||
      t['@nx/webpack:webpack'] ||
      t['@nx/next:build']
  );
}

function resolveStylesPath(
  tree: Tree,
  config: ProjectConfiguration,
  overrideRel?: string
): string | null {
  const candidateRel =
    overrideRel ??
    (config.sourceRoot
      ? path.join(config.sourceRoot, 'styles.css')
      : path.join(config.root, 'src/styles.css'));

  const normalized = toPosix(candidateRel);
  return tree.exists(normalized) ? normalized : null;
}

/* -------------------------- helpers: graph -------------------------- */

function collectTransitiveDeps(
  projectGraph: any,
  rootProject: string
): Set<string> {
  const deps = new Set<string>();
  const visited = new Set<string>();
  const queue = [rootProject];

  while (queue.length) {
    const curr = queue.shift()!;
    if (visited.has(curr)) continue;
    visited.add(curr);

    for (const d of projectGraph.dependencies[curr] ?? []) {
      if (!deps.has(d.target)) {
        deps.add(d.target);
        queue.push(d.target);
      }
    }
  }
  return deps;
}

function buildSourceDirectives(
  projectGraph: any,
  deps: Set<string>,
  stylesFsPath: string,
  appName: string
): string[] {
  const sources: string[] = [];
  const fromDir = path.dirname(stylesFsPath);

  for (const depName of deps) {
    if (depName === appName) continue;

    const node = projectGraph.nodes[depName];
    const root = node?.data?.root;
    if (!root) continue;

    const rel = toPosix(path.relative(fromDir, root)).replace(/^\.\//, '');
    sources.push(`@source '${rel}';`);
  }

  sources.sort();
  return sources;
}

/* -------------------------- helpers: css ops -------------------------- */

function readCss(tree: Tree, file: string): string {
  return tree.read(file)?.toString() ?? '';
}

function writeCss(tree: Tree, file: string, content: string): void {
  tree.write(file, content);
}

function hasTailwindImport(css: string): boolean {
  return css.includes("@import 'tailwindcss';");
}

function parseExistingSourceDirectives(css: string): Set<string> {
  // match either '…' or "…" after @source
  const re = /^\s*@source\s+['"][^'"]+['"];\s*$/gm;
  return new Set((css.match(re) ?? []).map((s) => s.trim()));
}

function needsUpdate(existing: Set<string>, next: string[]): boolean {
  if (existing.size !== next.length) return true;
  return next.some((s) => !existing.has(s));
}

function removeExistingSourceDirectives(css: string): string {
  // match either '…' or "…" after @source
  const re = /^\s*@source\s+['"][^'"]+['"];\s*$/gm;
  // Collapse extra blank lines after removal
  return css.replace(re, '').replace(/\n{3,}/g, '\n\n');
}

function insertSourcesAfterTailwindImport(
  css: string,
  sources: string[]
): string {
  if (sources.length === 0) return css;

  const importIdx = css.indexOf("@import 'tailwindcss';");
  if (importIdx === -1) return css;

  const lineEnd = css.indexOf('\n', importIdx);
  const insertPos = lineEnd === -1 ? css.length : lineEnd + 1;

  const before = css.slice(0, insertPos);
  const after = css.slice(insertPos);
  const block = `\n${sources.join('\n')}\n`;

  return before + block + after;
}

/* -------------------------- helpers: misc -------------------------- */

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}
