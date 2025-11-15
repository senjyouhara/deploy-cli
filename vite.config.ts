import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import fg from 'fast-glob';
import path from 'path';
import pkg from './package.json'


// 自动扫描 src 下所有 ts 文件作为多入口
const entries = Object.fromEntries(
  fg.sync('**/*.ts', { cwd: 'src' }).map(file => [
    file.replace(/\.ts$/, ''),
    path.resolve(__dirname, 'src', file),
  ])
);


// 基础配置
const baseConfig = {
  plugins: [
    tsconfigPaths(),
  ],
  define: {
    "process.env.PKG_VERSION": JSON.stringify(pkg.version),
    "process.env.NAME": JSON.stringify(pkg.name),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.vue', '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  // 开发服务器配置
  server: process.env.NODE_ENV == 'development' ? {
    port: 3000,
  } : undefined,
};


const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  /^node:/,
  'os',
  'path',
  'fs',
  'url',
  'module',
  'child_process',
  'assert',
]


// 获取包名作为 UMD 全局变量名（驼峰命名）
const getGlobalName = (pkgName: string) => {
  return pkgName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
    .replace(/[^a-zA-Z0-9_$]/g, '');
};
const globalName = getGlobalName(pkg.name);

// ESM 配置
const esmConfig = defineConfig({
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins,
    dts({
      entryRoot: 'src',
      outDir: 'es',
      tsconfigPath: './tsconfig.json',
      copyDtsFiles: true,
    }),
  ],
  build: {
    minify: false,
    lib: {
      entry: entries,
    },
    rollupOptions: {
      external,
      output: {
        format: 'es',
        dir: 'es',
        entryFileNames: '[name].js',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});


// CJS 配置
const cjsConfig = defineConfig({
  ...baseConfig,
  plugins: [
    ...baseConfig.plugins,
    dts({
      entryRoot: 'src',
      outDir: 'cjs',
      tsconfigPath: './tsconfig.json',
      copyDtsFiles: true,
    }),
  ],
  build: {
    minify: false,
    lib: {
      entry: entries,
    },
    rollupOptions: {
      external,
      output: {
        format: 'cjs',
        dir: 'cjs',
        entryFileNames: '[name].cjs',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});


// bundle配置
const bundleConfig = defineConfig({
  ...baseConfig,
  build: {
    emptyOutDir: false,
    minify: false,
    sourcemap: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'), // UMD 通常使用单一入口
      name: globalName,
      formats: ['cjs', 'umd'],
      fileName: (format) => `bundle.${format}.js`
    },
    rollupOptions: {
      external,
      output: {
        globals: {
          // 这里可以配置外部依赖的全局变量名
          // 例如: 'lodash': '_'
        },
        exports: 'named',
      },
    },
  },
});


// 压缩版本配置
const minConfig = defineConfig({
  ...baseConfig,
  build: {
    emptyOutDir: false,
    minify: 'esbuild',
    sourcemap: false,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: globalName,
      formats: ['cjs', 'umd'],
      fileName: (format) => `bundle.${format}.min.js`
    },
    rollupOptions: {
      external,
    },
  },
});


// 导出多个配置
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    if (mode === 'esm') return esmConfig;
    if (mode === 'cjs') return cjsConfig;
    if (mode === 'bundle') return bundleConfig;
    if (mode === 'min') return minConfig;

    // 默认返回所有配置数组，Vite 会依次执行
    return esmConfig
  }

  // dev 时返回开发配置
  return esmConfig;
});