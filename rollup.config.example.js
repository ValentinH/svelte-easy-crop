import babel from '@rollup/plugin-babel'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import svelte from 'rollup-plugin-svelte'
import { terser } from 'rollup-plugin-terser'
import { sveltePreprocess } from 'svelte-preprocess/dist/autoProcess'

const production = !process.env.ROLLUP_WATCH

export default {
  input: 'example/main.ts',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'example/public/bundle.js',
  },
  plugins: [
    svelte({
      // enable run-time checks when not in production
      dev: !production,
      // we'll extract any component CSS out into
      // a separate file - better for performance
      css: css => {
        css.write('public/build/bundle.css')
      },
      preprocess: sveltePreprocess(), // ts
    }),

    // If you have external dependencies installed from
    // npm, you'll most likely need these plugins. In
    // some cases you'll need additional configuration -
    // consult the documentation for details:
    // https://github.com/rollup/plugins/tree/master/packages/commonjs
    resolve({
      browser: true,
      dedupe: ['svelte'],
    }),
    commonjs(),
    typescript({ sourceMap: !production }), // ts

    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
  ],
}
