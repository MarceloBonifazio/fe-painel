// Resolução do alias `@/` do workload `fe-painel` (hooks de módulo do Node).
//
// POR QUE ISTO EXISTE: a plataforma padroniza `@/…` como caminho de import em TODOS os workloads
// JS/TS, para ninguém escrever `../../../shared/logger`. Em TypeScript quem resolve é o
// `tsconfig.json#paths` (o tsx e os bundlers leem de lá). Em JavaScript puro não há nada disso: o
// Node não conhece `@/` e o campo `imports` do package.json só aceita chaves começando com `#`.
// Este arquivo cobre esse caso — é o "loader" citado no Dockerfile/scripts:
//
//   node --import ./configs/alias-loader.mjs src/index.mjs
//
// Sem ele, um import `@/…` num arquivo .mjs falha com ERR_MODULE_NOT_FOUND.
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Raiz derivada do PRÓPRIO arquivo, e não de process.cwd(): assim o alias resolve igual rodando de
// qualquer diretório — dev, container, script de CI. Este arquivo mora em configs/, então src/ está um
// nível ACIMA — daí o '../src/'. Ao mover o arquivo, este caminho tem de mover com ele.
const SRC = new URL('../src/', import.meta.url);

// Em ESM a extensão é obrigatória, mas no TypeScript `@/shared/util` funciona sem ela. Testamos as
// mesmas formas que um bundler testaria, senão o MESMO import quebraria só no flavor js.
const CANDIDATES = ['', '.mjs', '.js', '/index.mjs', '/index.js'];

export async function resolve(specifier, context, nextResolve) {
  if (!specifier.startsWith('@/')) return nextResolve(specifier, context);

  const rel = specifier.slice(2);
  for (const suffix of CANDIDATES) {
    const url = new URL(rel + suffix, SRC);
    // isFile() e não existsSync: o caminho literal costuma casar com o DIRETÓRIO (src/lib) e o Node
    // recusa import de diretório (ERR_UNSUPPORTED_DIR_IMPORT) — tem de cair no /index.mjs.
    if (statSync(fileURLToPath(url), { throwIfNoEntry: false })?.isFile()) {
      return nextResolve(url.href, context);
    }
  }

  // Nada encontrado: delega o caminho literal p/ o Node emitir o ERR_MODULE_NOT_FOUND padrão, com o
  // caminho já resolvido na mensagem (mais útil que um erro nosso).
  return nextResolve(new URL(rel, SRC).href, context);
}
