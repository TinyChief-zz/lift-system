import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
module.exports = {
  input: 'src/main.js',
  output: {
    file: 'bundle.js',
    format: 'umd',
    name: 'MyModule',
  },
  plugins: [
    resolve(),
    commonjs(),
  ],
}
