import fs from "node:fs/promises";
import path from "node:path";

export function privateStorageRoot(): string {
  return (
    process.env.PRIVATE_STORAGE_DIR ??
    path.join(process.cwd(), "storage", "private")
  );
}

export function resolvePrivatePath(storageKey: string): string {
  const root = path.resolve(privateStorageRoot());
  const resolved = path.resolve(root, storageKey);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error("Invalid storage key");
  }
  return resolved;
}

export async function ensurePrivateStorage(): Promise<void> {
  await fs.mkdir(privateStorageRoot(), { recursive: true });
}

export async function writePrivateFile(
  storageKey: string,
  contents: string | Buffer,
): Promise<void> {
  await ensurePrivateStorage();
  const fullPath = resolvePrivatePath(storageKey);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, contents);
}

export async function readPrivateFile(storageKey: string): Promise<Buffer> {
  const fullPath = resolvePrivatePath(storageKey);
  return fs.readFile(fullPath);
}
