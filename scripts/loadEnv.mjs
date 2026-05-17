import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Carga claves simples desde `.env` en la raíz del repo (sin sobrescribir variables ya definidas).
 * @param {string} [cwd]
 */
export function loadEnvFromDotenv(cwd = process.cwd()) {
  const envPath = resolve(cwd, ".env");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split(/\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}
