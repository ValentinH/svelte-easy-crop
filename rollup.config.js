import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import svelte from 'rollup-plugin-svelte'
import autoPreprocess from 'svelte-preprocess'
import pkg from './package.json'

export default {
  input: 'src/index.svelte',
  output: [
    { file: pkg.module, format: 'es' },
    { file: pkg.main, format: 'umd', name: 'Cropper' },
  ],
  plugins: [
    svelte({ preprocess: autoPreprocess() }),
    resolve(),
    typescript({ sourceMap: !production }),
  ],
}
