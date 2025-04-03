<<<<<<< HEAD
import react from '@lahmjs/plugin-react'
import dotenv from 'dotenv'
import { defineConfig } from 'lahm'
import path from 'path'

dotenv.config()

// https://lahmjs.web.app/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    outDir: 'dist/client',
    minify: true,
    cssMinify: true
  }
})
=======
import react from '@lahmjs/plugin-react'
import dotenv from 'dotenv'
import { defineConfig } from 'lahm'
import path from 'path'

dotenv.config()

// https://lahmjs.web.app/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    outDir: 'dist/client',
    minify: true,
    cssMinify: true
  }
})
>>>>>>> 7051f79 (First commit)
