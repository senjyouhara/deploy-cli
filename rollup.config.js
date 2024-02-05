import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
import path from 'path'
import fs from 'fs'
import commonjs from '@rollup/plugin-commonjs'
import excludeDependenciesFromBundle from 'rollup-plugin-exclude-dependencies-from-bundle'
import postcss from 'rollup-plugin-postcss'
import filesize from 'rollup-plugin-filesize'
import precss from 'precss'
import autoprefixer from 'autoprefixer'
import resolve from '@rollup/plugin-node-resolve'
import externals from 'rollup-plugin-node-externals'
import builtins from 'rollup-plugin-node-builtins'
import globals from 'rollup-plugin-node-globals'
import image from 'rollup-plugin-inline-image'
import babel from 'rollup-plugin-babel'
// import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const OUTPUT_NAME = pkg.name

const ENVIRONMENT = process.env
const PRODUCTION = ENVIRONMENT.NODE_ENV === 'production' || ENVIRONMENT.production || ENVIRONMENT.production === 'true'

const GLOBALS = {
  // react: 'React',
  // 'react-dom': 'ReactDOM',
  // 'react-router-dom': 'reactRouterDom',
  // 'prop-types': 'PropTypes',
  // 'lodash': 'lodash',
  // 'react-number-format': 'NumberFormat',
  // 'react-ga': 'ReactGA',
  // 'react-dates': 'ReactDates',
  // 'styled-components': 'styled',
  // 'react-tag-autocomplete': 'ReactTags',
  // 'react-spinkit': 'Spinner',
  // 'react-select': 'Select',
}

const EXTERNAL = [
  // ...Object.keys(pkg.peerDependencies || {}),
  // ...Object.keys(pkg.dependencies || {}),
  'lodash',
  'dayjs',
  '@babel/core',
  'node-cmd',
  'node-ssh',
  'tslib',
  'chalk',
  'ora',
  'path',
  'fs',
  'vm',
  'os'
]

const getPlugins = (plugins = {}) => {
  return [
    // PRODUCTION && globals(),
    PRODUCTION && builtins(),
    PRODUCTION && externals(),
    resolve({
      // jsnext: true, // 该属性是指定将Node包转换为ES2015模块
      // main: true,
      // browser: false,
    }),
    commonjs({
      include: 'node_modules/**',
    }),
    babel({
      exclude: 'node_modules/**', // 仅仅转译我们的源码
      runtimeHelpers: true,
      extensions: ['.js', '.ts'],
    }),
    PRODUCTION &&
      json({
        include: ['src/**', 'package.json'],
      }),
    // postcss({ extract: plugins.cssPlugin, plugins: [autoprefixer, precss] }),
    typescript(plugins.typescript),
    PRODUCTION && filesize(),
    image(),
    PRODUCTION &&
      plugins.terser &&
      terser({
        compress: {
          pure_funcs: ['console.log'], // 去掉console.log函数
        },
      }),
  ].filter(Boolean)
}

const getOutputData = dir => {
  const umd = {
    file: `./lib/${dir.replace('.ts', '.umd.js')}`,
    format: 'umd',
    dir: 'dist',
  }
  const cjs = {
    file: `./lib/${dir.replace('.ts', '.cjs.js')}`,
    format: 'cjs',
    dir: 'dist',
  }
  const es = {
    file: `./es/${dir.replace('.ts', '.es.js')}`,
    format: 'es',
    dir: 'dist',
  }

  return [
    { ...umd },
     { ...es },
     { ...cjs }
    ]
}

const WATCH = {
  chokidar: {
    usePolling: true,
    paths: 'src/**',
  },
}

const _getScanPath = (basePath, fullPath) => {
  if (!fullPath || !fs.existsSync(fullPath)) {
    return []
  }

  let list = []

  var stat = fs.statSync(fullPath)

  if (stat.isDirectory()) {
    const fileList = fs.readdirSync(fullPath, 'utf-8')
    fileList.forEach(v => {
      list.push(..._getScanPath(basePath, path.join(fullPath, '/', v)))
    })
  } else {
    list.push({ pathName: fullPath.replace(basePath + path.sep, ''), path: fullPath })
  }

  return list
}

/** 获取入口文件 */
// const getScanPath = basePath => _getScanPath(basePath, basePath)
// const scanPathList = getScanPath(path.resolve(__dirname, 'src'))
// console.log(scanPathList, 'scanPathList')

// const inputAll = scanPathList.reduce((t, c) => {
//   t[c.pathName.replace('.ts', '')] = c.path
//   return t
// }, {})

const getBundleInfo = (isMin, input, filter, plugin) => {
  let data = getOutputData('index.ts')
  if (filter) {
    data = data.filter(filter)
  }
  return [{
    input,
    output: data.map(({ file, format, dir, name }) => ({
      format,
      sourcemap: true,
      globals: GLOBALS,
      exports: 'auto',
      file: `${dir}/bundle${isMin ? '.min' : ''}.${format}.js`,
      name: OUTPUT_NAME,
    })),
    watch: WATCH,
    external: EXTERNAL,
    plugins: getPlugins(plugin),
  }]
}

const config = getBundleInfo(false, './src/index.ts')
    .concat(getBundleInfo(true, './src/index.ts', null, { terser: true }))

export default config
