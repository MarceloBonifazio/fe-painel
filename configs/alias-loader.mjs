// Registra os hooks de resolução do alias `@/` do `fe-cep-painel` (ver alias-hooks.mjs).
//
// Usado só no flavor JAVASCRIPT: `node --import ./configs/alias-loader.mjs src/index.mjs`. No flavor
// TypeScript quem resolve `@/` é o tsconfig.json#paths, que o tsx lê sozinho — lá este arquivo não
// entra no boot.
//
// Arquivo separado do alias-hooks.mjs porque o `register()` roda na thread principal e os hooks
// rodam numa thread própria: é o contrato da API de módulos do Node.
import { register } from 'node:module';

// Caminho relativo a ESTE arquivo (import.meta.url), então os dois seguem juntos em configs/.
register('./alias-hooks.mjs', import.meta.url);
