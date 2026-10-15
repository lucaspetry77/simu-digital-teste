// Instala itens de registries compatíveis com shadcn (Arc UI e lucide-animated)
// sem passar pelo `shadcn init`, que reescreveria o globals.css do projeto.
//
//   node scripts/add-ui.mjs arc:button arc:morph-select icon:arrow-right …
//
// arc:<nome>  → https://uiarc.dev/r/<nome>.json        → src/components/arc/…
// icon:<nome> → https://lucide-animated.com/r/<nome>.json → src/components/icons/…
import { execSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const seen = new Set();
const npmDeps = new Set();

function urlFor(spec) {
  if (spec.startsWith("http")) return spec;
  const [ns, name] = spec.split(":");
  if (ns === "arc") return `https://uiarc.dev/r/${name}.json`;
  if (ns === "icon") return `https://lucide-animated.com/r/${name}.json`;
  throw new Error(`Prefixo desconhecido: ${spec}`);
}

function targetFor(url, file) {
  if (file.target?.startsWith("@components/")) return path.join(SRC, "components", file.target.slice("@components/".length));
  if (url.includes("lucide-animated.com")) return path.join(SRC, "components", "icons", path.basename(file.path));
  throw new Error(`Sem destino para ${file.path} (${url})`);
}

async function install(spec) {
  const url = urlFor(spec);
  if (seen.has(url)) return;
  seen.add(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const item = await res.json();
  for (const dep of item.registryDependencies ?? []) {
    if (dep.startsWith("http")) await install(dep);
  }
  for (const d of item.dependencies ?? []) npmDeps.add(d);
  for (const file of item.files ?? []) {
    const dest = targetFor(url, file);
    await mkdir(path.dirname(dest), { recursive: true });
    let content = file.content;
    // os ícones importam `cn` de @/lib/utils (convenção do shadcn)
    content = content.replaceAll('from "@/lib/utils"', 'from "@/lib/cn"');
    await writeFile(dest, content);
    console.log(`  ✓ ${path.relative(ROOT, dest)}`);
  }
}

const specs = process.argv.slice(2);
if (!specs.length) {
  console.log("Uso: node scripts/add-ui.mjs arc:button icon:arrow-right …");
  process.exit(1);
}
for (const s of specs) await install(s);

const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
const missing = [...npmDeps].filter((d) => !pkg.dependencies?.[d] && !pkg.devDependencies?.[d]);
if (missing.length) {
  console.log(`npm install ${missing.join(" ")}`);
  execSync(`npm install ${missing.join(" ")}`, { stdio: "inherit" });
}
