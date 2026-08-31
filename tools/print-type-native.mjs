#!/usr/bin/env node
// native extraction: tsgo's hidden `--api` mode via the shipped sync client.
// usage: print-type-native.mjs <file.ts> <TypeAliasName> [tsconfig]
import { API } from "@typescript/native-preview/unstable/sync";
import { isTypeAliasDeclaration } from "@typescript/native-preview/unstable/ast/is";
import { resolve } from "node:path";

const [file, aliasName] = process.argv.slice(2);
if (!file || !aliasName) {
  console.error("usage: print-type-native.mjs <file.ts> <TypeAliasName>");
  process.exit(2);
}

const api = new API({ cwd: process.cwd() });
const snapshot = api.updateSnapshot({ openFiles: [resolve(file)] });
const project = snapshot.getDefaultProjectForFile(resolve(file));
if (!project) {
  console.error(`no project found for ${file}`);
  process.exit(2);
}

const source = project.program.getSourceFile(resolve(file));
if (!source) {
  console.error(`file not in project: ${file}`);
  process.exit(2);
}

let decl;
source.forEachChild((node) => {
  if (isTypeAliasDeclaration(node) && node.name?.text === aliasName) {
    decl = node;
  }
});
if (!decl) {
  console.error(`no type alias '${aliasName}' in ${file}`);
  process.exit(2);
}

const type = project.checker.getTypeAtLocation(decl.type ?? decl);
const NO_TRUNCATION = 1; // NodeBuilderFlags.NoTruncation
const IN_TYPE_ALIAS = 1 << 23; // TypeFormatFlags.InTypeAlias
console.log(project.checker.typeToString(type, decl, NO_TRUNCATION | IN_TYPE_ALIAS));
api.close();
