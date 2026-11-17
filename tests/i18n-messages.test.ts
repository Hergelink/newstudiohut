import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import {
  parse,
  TYPE,
  type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser";
import {
  IntlMessageFormat,
  type FormatXMLElementFn,
  type PrimitiveType,
} from "intl-messageformat";
import { createTranslator } from "next-intl";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import en from "../messages/en.json";
import tr from "../messages/tr.json";

type Catalog = { [key: string]: string | Catalog };
type Parameter = { kinds: Set<string>; selections: Set<string> };

function flatten(catalog: Catalog, prefix = ""): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(catalog)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") result.set(path, value);
    else {
      expect(value, path).not.toBeNull();
      expect(Array.isArray(value), path).toBe(false);
      for (const [nestedKey, nestedValue] of flatten(value, path)) {
        result.set(nestedKey, nestedValue);
      }
    }
  }
  return result;
}

function parameters(ast: MessageFormatElement[]): Map<string, Parameter> {
  const result = new Map<string, Parameter>();
  function visit(elements: MessageFormatElement[]) {
    for (const element of elements) {
      if (element.type === TYPE.literal || element.type === TYPE.pound)
        continue;
      const parameter = result.get(element.value) ?? {
        kinds: new Set(),
        selections: new Set(),
      };
      parameter.kinds.add(TYPE[element.type]);
      result.set(element.value, parameter);
      if (element.type === TYPE.select || element.type === TYPE.plural) {
        for (const [selector, option] of Object.entries(element.options)) {
          if (element.type === TYPE.select) parameter.selections.add(selector);
          visit(option.value);
        }
      } else if (element.type === TYPE.tag) visit(element.children);
    }
  }
  visit(ast);
  return result;
}

function parsed(message: string, label: string) {
  try {
    return parse(message, { requiresOtherClause: true });
  } catch (error) {
    throw new Error(`Invalid ICU message: ${label}`, { cause: error });
  }
}

const catalogs = { en: flatten(en), tr: flatten(tr) };
const keys = [...catalogs.en.keys()].sort();

describe("complete Turkish and English message catalogs", () => {
  it("has exactly the same message keys in both languages", () => {
    expect([...catalogs.tr.keys()].sort()).toEqual(keys);
  });

  it.each(Object.entries(catalogs))(
    "%s messages are nonempty, NFC-normalized Unicode",
    (locale, catalog) => {
      for (const [key, value] of catalog) {
        const label = `${locale}.${key}`;
        expect(value.trim(), label).not.toBe("");
        expect(value, label).toBe(value.normalize("NFC"));
        expect(value, label).not.toContain("\uFFFD");
      }
    },
  );

  it("parses every ICU message and preserves interpolation/tag names across languages", () => {
    for (const key of keys) {
      const english = parameters(parsed(catalogs.en.get(key)!, `en.${key}`));
      const turkish = parameters(parsed(catalogs.tr.get(key)!, `tr.${key}`));
      expect([...turkish.keys()].sort(), key).toEqual(
        [...english.keys()].sort(),
      );
      for (const [name, parameter] of english) {
        expect(turkish.get(name)?.kinds.has("tag"), `${key}.${name}`).toBe(
          parameter.kinds.has("tag"),
        );
      }
    }
  });

  it("formats every message with all parameters and 0, 1, and 2 count samples", () => {
    for (const key of keys) {
      const english = parameters(parsed(catalogs.en.get(key)!, `en.${key}`));
      const turkish = parameters(parsed(catalogs.tr.get(key)!, `tr.${key}`));
      for (const [locale, catalog] of Object.entries(catalogs)) {
        const message = catalog.get(key)!;
        const specs = locale === "en" ? english : turkish;
        const translator = createTranslator({
          locale,
          messages: { message },
          timeZone: "Europe/Istanbul",
          onError(error) {
            throw error;
          },
        });
        for (const count of [0, 1, 2]) {
          const label = `${locale}.${key} (count=${count})`;
          const formatterValues: Record<
            string,
            PrimitiveType | FormatXMLElementFn<string>
          > = {};
          const translatorValues: Record<
            string,
            string | number | Date | ((chunks: string) => string)
          > = {};
          for (const [name, spec] of specs) {
            const otherSpec = (locale === "en" ? turkish : english).get(name);
            const kinds = new Set([...spec.kinds, ...(otherSpec?.kinds ?? [])]);
            if (kinds.has("tag")) {
              formatterValues[name] = (chunks) => chunks.join("");
              translatorValues[name] = (chunks) => chunks;
              continue;
            }
            const value =
              kinds.has("date") || kinds.has("time")
                ? new Date("2026-11-16T12:00:00Z")
                : kinds.has("number") ||
                    kinds.has("plural") ||
                    /count|days|views|leads|order|limit|index/i.test(name)
                  ? count
                  : kinds.has("select")
                    ? [...spec.selections][count % spec.selections.size]
                    : `Sample ${name}`;
            formatterValues[name] = value;
            translatorValues[name] = value;
          }
          expect(
            () =>
              new IntlMessageFormat(message, locale).format(formatterValues),
            label,
          ).not.toThrow();
          const output = translator.markup("message", translatorValues);
          expect(output.trim(), label).not.toBe("");
          expect(output, label).not.toContain("\uFFFD");
        }
      }
    }
  });
});

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : /\.tsx?$/.test(entry.name)
        ? [path]
        : [];
  });
}

function unwrap(expression: ts.Expression): ts.Expression {
  return ts.isAwaitExpression(expression) ||
    ts.isParenthesizedExpression(expression) ||
    ts.isAsExpression(expression)
    ? unwrap(expression.expression)
    : expression;
}

function staticStrings(expression: ts.Expression | undefined): string[] {
  if (!expression) return [];
  const value = unwrap(expression);
  if (ts.isStringLiteralLike(value)) return [value.text];
  if (ts.isConditionalExpression(value))
    return [
      ...staticStrings(value.whenTrue),
      ...staticStrings(value.whenFalse),
    ];
  return [];
}

describe("translation keys referenced by application source", () => {
  it("resolves statically known keys against both catalogs, including scoped and Promise.all translators", () => {
    const files = sourceFiles(join(process.cwd(), "src"));
    const program = ts.createProgram(files, {
      noResolve: true,
      noLib: true,
      jsx: ts.JsxEmit.Preserve,
    });
    const checker = program.getTypeChecker();
    const namespaces = new Map<ts.Symbol, string>();
    const factories = new Map<ts.Symbol, string>();
    const references: { key: string; location: string }[] = [];

    function namespace(
      expression: ts.Expression | undefined,
    ): string | undefined {
      if (!expression) return undefined;
      const value = unwrap(expression);
      if (!ts.isCallExpression(value) || !ts.isIdentifier(value.expression))
        return undefined;
      const name = value.expression.text;
      if (
        ["useTranslations", "getTranslations", "createTranslator"].includes(
          name,
        )
      ) {
        const argument = value.arguments[0];
        if (argument && ts.isStringLiteralLike(argument)) return argument.text;
        if (argument && ts.isObjectLiteralExpression(argument)) {
          const property = argument.properties.find(
            (item) =>
              ts.isPropertyAssignment(item) &&
              item.name.getText() === "namespace",
          );
          if (property && ts.isPropertyAssignment(property))
            return staticStrings(property.initializer)[0];
        }
      }
      const symbol = checker.getSymbolAtLocation(value.expression);
      return symbol ? factories.get(symbol) : undefined;
    }

    function bind(node: ts.Node) {
      if (ts.isVariableDeclaration(node) && node.initializer) {
        const initial = unwrap(node.initializer);
        if (ts.isIdentifier(node.name)) {
          const symbol = checker.getSymbolAtLocation(node.name);
          const resolved = namespace(initial);
          if (symbol && resolved !== undefined)
            namespaces.set(symbol, resolved);
          if (
            symbol &&
            ts.isArrowFunction(initial) &&
            !ts.isBlock(initial.body)
          ) {
            const factoryNamespace = namespace(initial.body);
            if (factoryNamespace !== undefined)
              factories.set(symbol, factoryNamespace);
          }
        } else if (
          ts.isArrayBindingPattern(node.name) &&
          ts.isCallExpression(initial) &&
          initial.expression.getText() === "Promise.all"
        ) {
          const argument = initial.arguments[0];
          if (argument && ts.isArrayLiteralExpression(argument)) {
            node.name.elements.forEach((binding, index) => {
              if (
                !ts.isBindingElement(binding) ||
                !ts.isIdentifier(binding.name)
              )
                return;
              const symbol = checker.getSymbolAtLocation(binding.name);
              const resolved = namespace(argument.elements[index]);
              if (symbol && resolved !== undefined)
                namespaces.set(symbol, resolved);
            });
          }
        }
      }
      ts.forEachChild(node, bind);
    }

    function inspect(node: ts.Node) {
      if (ts.isCallExpression(node)) {
        const target =
          ts.isPropertyAccessExpression(node.expression) &&
          ["rich", "markup", "raw"].includes(node.expression.name.text)
            ? node.expression.expression
            : node.expression;
        const symbol = ts.isIdentifier(target)
          ? checker.getSymbolAtLocation(target)
          : undefined;
        const resolved = symbol ? namespaces.get(symbol) : namespace(target);
        if (resolved !== undefined) {
          const source = node.getSourceFile();
          const { line } = source.getLineAndCharacterOfPosition(
            node.getStart(),
          );
          for (const key of staticStrings(node.arguments[0]))
            references.push({
              key: resolved ? `${resolved}.${key}` : key,
              location: `${relative(process.cwd(), source.fileName)}:${line + 1}`,
            });
        }
      }
      ts.forEachChild(node, inspect);
    }

    const sources = files
      .map((file) => program.getSourceFile(file)!)
      .filter(Boolean);
    sources.forEach(bind);
    sources.forEach(inspect);
    expect(references.length).toBeGreaterThan(400);
    for (const { key, location } of references) {
      for (const [locale, catalog] of Object.entries(catalogs)) {
        expect(catalog.has(key), `${location}: missing ${locale}.${key}`).toBe(
          true,
        );
      }
    }
  });
});
