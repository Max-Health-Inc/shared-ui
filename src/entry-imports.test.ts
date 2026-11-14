import { describe, expect, it } from "bun:test"
import { isBuiltin } from "node:module"
import ts from "typescript"

const CONSUMER_INSTALLED: Readonly<Record<string, readonly string[]>> = {
  recharts: ["./charts"],
  vite: ["./vite"],
}

const root = ts.sys.getCurrentDirectory()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readManifest(): Record<string, unknown> {
  const text = ts.sys.readFile(`${root}/package.json`)
  if (text === undefined) throw new Error("package.json not found")
  const parsed: unknown = JSON.parse(text)
  if (!isRecord(parsed)) throw new Error("package.json is not an object")
  return parsed
}

function keysOf(value: unknown): string[] {
  return isRecord(value) ? Object.keys(value) : []
}

function packageName(specifier: string): string {
  const parts = specifier.split("/")
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? specifier)
}

function sourceOf(built: string): string {
  const stem = `${root}/${built.replace(/^\.\/dist\//, "src/").replace(/\.js$/, "")}`
  const found = [".ts", ".tsx", ".js"].map((ext) => stem + ext).find((file) => ts.sys.fileExists(file))
  if (found === undefined) throw new Error(`no source for ${built}`)
  return found
}

const { config } = ts.readConfigFile(`${root}/tsconfig.json`, ts.sys.readFile)
const { options } = ts.parseJsonConfigFileContent(config, ts.sys, root)

function packagesReachedFrom(entry: string): Set<string> {
  const reached = new Set<string>()
  const seen = new Set<string>()
  const queue = [entry]
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (seen.has(file)) continue
    seen.add(file)
    const source = ts.sys.readFile(file)
    if (source === undefined) throw new Error(`cannot read ${file}`)
    for (const { fileName: specifier } of ts.preProcessFile(source, true, true).importedFiles) {
      if (!specifier.startsWith(".")) {
        if (!isBuiltin(specifier)) reached.add(packageName(specifier))
        continue
      }
      const resolved = ts.resolveModuleName(specifier, file, options, ts.sys).resolvedModule
      if (!resolved) throw new Error(`${file} imports ${specifier}, which does not resolve`)
      queue.push(resolved.resolvedFileName)
    }
  }
  return reached
}

const manifest = readManifest()
const exportsMap = isRecord(manifest.exports) ? manifest.exports : {}
const entries = Object.entries(exportsMap).flatMap(([name, target]) => {
  if (!isRecord(target) || typeof target.import !== "string") return []
  return [{ name, reached: packagesReachedFrom(sourceOf(target.import)) }]
})

describe("package entry points", () => {
  it("resolves every JavaScript entry point to its source", () => {
    expect(entries.map(({ name }) => name)).toContain("./charts")
  })

  it.each(entries)("$name reaches a consumer-installed package only where the package says it may", ({ name, reached }) => {
    for (const [pkg, allowed] of Object.entries(CONSUMER_INSTALLED)) {
      expect(reached.has(pkg)).toBe(allowed.includes(name))
    }
  })

  it.each(entries)("$name imports only packages the manifest declares", ({ name, reached }) => {
    const declared = new Set([
      ...keysOf(manifest.dependencies),
      ...keysOf(manifest.peerDependencies),
      ...Object.entries(CONSUMER_INSTALLED).filter(([, allowed]) => allowed.includes(name)).map(([pkg]) => pkg),
    ])
    expect([...reached].filter((pkg) => !declared.has(pkg))).toEqual([])
  })

  it.each(Object.keys(CONSUMER_INSTALLED))("%s is a devDependency, never a dependency or peer", (pkg) => {
    expect(keysOf(manifest.devDependencies)).toContain(pkg)
    expect(keysOf(manifest.dependencies)).not.toContain(pkg)
    expect(keysOf(manifest.peerDependencies)).not.toContain(pkg)
  })

  it("marks no peer optional, because GitHub Packages drops peerDependenciesMeta and npm then installs every peer", () => {
    expect(manifest.peerDependenciesMeta).toBeUndefined()
  })
})
