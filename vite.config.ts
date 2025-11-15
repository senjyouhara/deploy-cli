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

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    // ----- DTS for ESM -----
    dts({
      entryRoot: 'src',
      outDir: 'es',
      tsconfigPath: './tsconfig.json',
      copyDtsFiles: true,
    }),

    // ----- DTS for CJS -----
    dts({
      entryRoot: 'src',
      outDir: 'cjs',
      tsconfigPath: './tsconfig.json',
      copyDtsFiles: true,
    }),
  ],

  resolve: {
alias: {
'@': path.resolve(__dirname, './src'), // 配置路径别名
},
extensions: ['.vue', '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'], // 省略的文件后缀
  },

  build: {
    sourcemap: false, // 不要 map
    lib: {
      entry: entries,
    },

    rollupOptions: {
        external: [
          ...Object.keys(pkg.dependencies  || {}),
          ...Object.keys(pkg.devDependencies || {}),
        /^node:/,
        'os',
        'path',
        'fs',
        'url',
        'module',
        'child_process',
        'assert',
      ],
      output: [
        // --- ESM 输出到 es ---
        {
          format: 'es',
          dir: 'es',
          entryFileNames: '[name].js',
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
        // --- CJS 输出到 cjs ---
        {
          format: 'cjs',
          dir: 'cjs',
          entryFileNames: '[name].cjs',
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
      ],
    },
  },
});
