import ts from "typescript";
import { posix } from "node:path";

/** @param {string} file @param {string} source @returns {string[]} */
export function checkSource(file, source) {
  file = file.replaceAll("\\", "/");
  const owner = file.match(/^(?:packages|apps|services)\/[^/]+/)?.[0];
  if (!owner) return [];
  const violations = new Set();
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const domain = owner === "packages/domain";
  const browserAuthorityWorker = /^apps\/web\/src\/[^/]+\.worker\.ts$/.test(file);
  const forbiddenDb = (file.startsWith("apps/") && !browserAuthorityWorker) || ["packages/plugin-sdk", "packages/sync-protocol"].includes(owner);
  function checkImport(specifier) {
    const target = specifier.startsWith(".") ? posix.normalize(posix.join(posix.dirname(file), specifier)) : specifier;
    const db = /^@tessera-ts\/graph-db(?:\/|$)/.test(target) || /^packages\/graph-db(?:\/|$)/.test(target);
    if (forbiddenDb && db) violations.add("must not depend on graph-db");
    const targetOwner = target.match(/^(?:packages|apps|services)\/[^/]+/)?.[0];
    if (/^@tessera-ts\/[^/]+\/src(?:\/|$)/.test(target) || (targetOwner && targetOwner !== owner && target.startsWith(`${targetOwner}/src/`))) {
      violations.add("cross-package private src import");
    }
    if (domain && /^(?:react(?:-dom)?|electron|better-sqlite3|sqlite3|node:sqlite)(?:\/|$)/.test(target)) {
      violations.add("domain must be runtime/framework independent");
    }
  }
  function visit(node) {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) checkImport(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) {
      const argument = node.arguments[0];
      if (argument && ts.isStringLiteralLike(argument)) checkImport(argument.text);
    }
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) checkImport(node.argument.literal.text);
    if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)) checkImport(node.moduleReference.expression.text);
    if (domain && ts.isIdentifier(node) && ["window", "document", "navigator", "localStorage", "sessionStorage"].includes(node.text)) {
      violations.add("domain must not use browser globals");
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return [...violations];
}
