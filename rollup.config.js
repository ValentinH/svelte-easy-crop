import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import svelte from 'rollup-plugin-svelte'
import { sveltePreprocess } from 'svelte-preprocess/dist/autoProcess'
import pkg from './package.json'

const production = !process.env.ROLLUP_WATCH

export default {
  input: 'src/index.svelte',
  output: [
    { file: pkg.module, format: 'es' },
    { file: pkg.main, format: 'umd', name: 'Cropper' },
  ],
  plugins: [
    svelte({ preprocess: sveltePreprocess({ typescript: true }) }),
    resolve(),
    typescript({ sourceMap: !production }),
  ],
}
