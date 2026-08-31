import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const frontendRoot = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
    envDir: '../',
    plugins: [react(), tailwindcss()],
    server: {
        fs: {
            allow: [frontendRoot, projectRoot],
        },
    },
})