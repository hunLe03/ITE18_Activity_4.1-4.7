import { defineConfig } from 'vite';
import { resolve } from 'path';

const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env;


export default defineConfig({
    root: 'src/',
    publicDir: '../static/',
    base: './',
    server: {
        host: true,
        open: !isCodeSandbox,
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return id.split('node_modules/')[1].split('/')[0];
                    }
                },
            },
        },
        outDir: '../dist/',
        emptyOutDir: true,
        sourcemap: true
    }
});
