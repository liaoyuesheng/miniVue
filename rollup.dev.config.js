import resolve from '@rollup/plugin-node-resolve'
import typescript from "@rollup/plugin-typescript"
import commonjs from '@rollup/plugin-commonjs'
import eslint from "@rbnlffl/rollup-plugin-eslint"
import livereload from 'rollup-plugin-livereload'
import serve from 'rollup-plugin-serve'

export default {
  input: 'src/core/index.ts',
  output: [
    {
      file: './docs/vue.esm.js',
      format: 'esm',
      name: 'debounce',
      sourcemap: true,
    }
  ],
  plugins: [
    eslint(),
    resolve(),
    typescript(),
    commonjs(),
    livereload({
      watch: './docs/',
    }),
    serve({
      open: true,
      port: 8000,
      contentBase: ['docs'],
      openPage: '/index.html',
    })
  ],
}
