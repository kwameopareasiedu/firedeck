import { UserConfig } from 'vite';

interface FiredeckConfig {
    vite: UserConfig;
}
declare function defineConfig(config: FiredeckConfig): FiredeckConfig;

export { defineConfig };
