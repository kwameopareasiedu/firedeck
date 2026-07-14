import type { UserConfig } from "vite";

interface FiredeckConfig {
  vite: UserConfig;
}

export function defineConfig(config: FiredeckConfig) {
  return config;
}
