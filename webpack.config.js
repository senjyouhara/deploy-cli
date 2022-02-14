const webpack = require('webpack')
const fs = require('fs')
const path = require('path')
const nodeExternals = require('webpack-node-externals')
const TerserPlugin = require('terser-webpack-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const resolve = url => path.resolve(__dirname, url)
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
const getScanPath = basePath => _getScanPath(basePath, basePath)
const scanPathList = getScanPath(path.resolve(__dirname, 'src'))
const extras = scanPathList.reduce((t, c) => {
  const key =
    '@/' +
    c.pathName
      .replace(/\.[jt]s$/, '')
      .replace('src', '@')
      .replace(/\\+index/g, '')
      .replace(/\\+/g, '/')
  const value =
    `@hizakura/deploy-cli/lib/` +
    c.pathName
      .replace(/\.[jt]s$/, '')
      .replace(/\\+index/g, '')
      .replace(/\\+/g, '/')

  if (!t[key]) {
    t[key] = value
  }
  return t
}, {})

console.log(extras, 'extras')
module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: false,
  entry: scanPathList.reduce((t, c) => {
    const key = c.pathName.replace(/\.[jt]s$/, '')
    const value = c.path

    if (!t[key]) {
      t[key] = value
    }
    return t
  }, {}),
  // entry: ['./src/index.ts'],
  output: {
    path: resolve('lib'),
    filename: '[name].js',
    publicPath: '/',
    library: '@hizakura/deploy-cli',
    globalObject: 'this',
    chunkFilename: '[id].js',
    libraryTarget: 'commonjs2',
  },
  externals: [
    nodeExternals(),
    'os-browserify',
    extras,
  ],
  resolve: {
    extensions: ['.js', '.json', '.ts'],
    modules: ['node_modules'],
    alias: {
      'deploy-cli': resolve('.'),
      '@': resolve('src'),
    },
  },
  performance: {
    hints: false,
  },
  // stats: 'none',
  module: {
    rules: [
      {
        test: /\.[jt]s$/,
        use: [
          {
            loader: require.resolve('babel-loader'),
          },
          'ts-loader',
        ],

        exclude: /node_modules/,
      },
    ],
  },

  optimization: {
    // concatenateModules: true,
    // noEmitOnErrors: true,
    minimize: false,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            ecma: 5,
            comments: false,
          },
          compress: {
            warnings: false,
            // drop_console: false,
            // drop_debugger: false,
            // pure_funcs: ['console.log'],
          },
        },
        parallel: true,
        sourceMap: false,
        extractComments: false,
      }),
    ],
  },

  node: {
    process: false,
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.PKG_VERSION': JSON.stringify(require('./package').version),
      'process.env.NAME': JSON.stringify(require('./package').name),
      PKG_VERSION: JSON.stringify(require('./package').version),
      NAME: JSON.stringify(require('./package').name),
    }),
    new ProgressBarPlugin(),
  ],
}
