import { defineConfig } from '@ice/pkg';
const packageJson = require('./package.json')

// https://pkg.ice.work/reference/config/
export default defineConfig({
generateTypesForJs: true,
alias: {
    '@': './src',
  },
  define: {
	"process.env.PKG_VERSION": packageJson.version,
	"process.env.NAME": packageJson.name,
  },
  transform: {
    formats: ['es2017'],
  },
});
