import typescript from 'rollup-plugin-typescript2'
import json from 'rollup-plugin-json'
import path from 'path'
import fs from 'fs'
import { name } from './package.json'
import sourcemaps from 'rollup-plugin-sourcemaps'
import commonjs from 'rollup-plugin-commonjs'
import excludeDependenciesFromBundle from 'rollup-plugin-exclude-dependencies-from-bundle'
import cleanup from 'rollup-plugin-cleanup'
import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'

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

/** 区别打包环境 */
const mode = process.env.NODE_ENV
const isProd = mode === 'production'

/** 获取入口文件 */
const getScanPath = basePath => _getScanPath(basePath, basePath)
const scanPathList = getScanPath(path.resolve(__dirname, 'src'))

/**
 * @type {import('rollup')}
 */
export default {
  // 入口文件
  // input: scanPathList.reduce((t, c) => {
  //   if (!t[c.pathName]) {
  //     t[c.pathName] = c.path
  //   }
  //   return t
  // }, {}),
  input: './src/index.ts',
  output: [
    {
      // 打包名称
      name,
      // 文件顶部信息
      // banner: '#!/usr/bin/env node',
      file: 'lib/index.js',
      format: 'cjs',
      sourcemap: false,
    },
  ],
  external: ['@kamisiro/deploy-cli', 'tslib'],
  plugins: [
    // cleanup(),
    resolve({
      // jsnext: true, // 该属性是指定将Node包转换为ES2015模块
      // main: true,
      // browser: true,
    }),
    // commonjs(),
    babel({
      exclude: 'node_modules/**', // 仅仅转译我们的源码
    }),
    json({
      include: ['src/**', 'package.json'],
    }),
    excludeDependenciesFromBundle(),
    typescript(),
    // sourcemaps(),
    // isProd &&
    //   terser({
    //     compress: {
    //       pure_funcs: ['console.log'], // 去掉console.log函数
    //     },
    //   }),
  ],
}
