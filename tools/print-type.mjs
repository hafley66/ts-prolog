#!/usr/bin/env node
// print the fully evaluated form of a type alias: node tools/print-type.mjs <file> <alias>
import { createRequire } from "node:module";
const ts = createRequire(import.meta.url)("ts5");

const [file, aliasName] = process.argv.slice(2);
if (!file || !aliasName) {
  console.error("usage: print-type.mjs <file.ts> <TypeAliasName>");
  process.exit(2);
}

const program = ts.createProgram([file], {
  strict: true,
  noEmit: true,
  target: ts.ScriptTarget.ES2022,
  skipLibCheck: true,
});
const checker = program.getTypeChecker();
const source = program.getSourceFile(file);

let decl;
source.forEachChild((node) => {
  if (ts.isTypeAliasDeclaration(node) && node.name.text === aliasName) decl = node;
});
if (!decl) {
  console.error(`no type alias '${aliasName}' in ${file}`);
  process.exit(2);
}

const type = checker.getTypeAtLocation(decl.type);
const text = checker.typeToString(
  type,
  decl,
  ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias,
);
console.log(text);
