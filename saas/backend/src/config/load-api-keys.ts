import * as fs from 'fs';
import * as path from 'path';

export type ApiKeyEntry = { name: string; token: string };

/** Charge les entrées nom → token depuis `API_KEYS_JSON` ou le fichier `API_KEYS_FILE`. */
export function loadApiKeys(): ApiKeyEntry[] {
  const rawJson = process.env.API_KEYS_JSON?.trim();
  if (rawJson) {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('API_KEYS_JSON must be a JSON array of { name, token }');
    }
    return parsed as ApiKeyEntry[];
  }

  const filePath = process.env.API_KEYS_FILE ?? 'config/api-keys.local.json';
  const resolved = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  if (!fs.existsSync(resolved)) {
    return [];
  }
  const content = fs.readFileSync(resolved, 'utf-8');
  const parsed = JSON.parse(content) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('API keys file must contain a JSON array of { name, token }');
  }
  return parsed as ApiKeyEntry[];
}

export function allowedTokensFromEntries(entries: ApiKeyEntry[]): Set<string> {
  return new Set(entries.map((e) => e.token));
}
