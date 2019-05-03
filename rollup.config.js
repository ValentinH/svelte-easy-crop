import svelte from 'rollup-plugin-svelte'
import resolve from 'rollup-plugin-node-resolve'
import pkg from './package.json'

const input = 'src/index.svelte'

export default [
  {
    input,
    output: { file: pkg.main, format: 'umd', name: 'Cropper' },
    plugins: [svelte(), resolve()],
  },
  {
    input,
    output: { file: pkg.module, format: 'es' },
    external: ['svelte/internal'],
    plugins: [svelte()],
  },
]
