const packageJson = require('./package.json')

const replaceObj = {
  "process.env.NODE_ENV": process.env.NODE_ENV,
  "process.env.PKG_VERSION": packageJson.version,
  "process.env.NAME": packageJson.name,
}

module.exports = {
  comments: false,
  presets: [
    !process.env.isRollup && [
      '@babel/preset-env',
      {
        modules: 'cjs',
        targets: {
          esmodules: true,
        },
      },
    ],
    "@babel/preset-typescript"
  ].filter(Boolean),
  plugins: [
   '@babel/plugin-external-helpers',
    ['@babel/plugin-transform-runtime'],
     // ["module-resolver", {
     //   "root": ["./"],
     //   "alias": {
     //     "deploy-lib": "@kamisiro/deploy-cli/lib",
     //   }
     // }],
    ["define-patterns", {
      "replacements": replaceObj
    }],
  ],
  "env": {
    "component": {
      "presets": [
        [
          '@babel/preset-env',
          {
            modules: false,
            bugfixes: true,
            targets: {
              esmodules: true,
            },
          },
        ],
      ],
      "plugins": [
        ['@babel/plugin-transform-runtime',{
          useESModules: true,
        }],
        // ["module-resolver", {
        //   "root": ["./"],
        //   "alias": {
        //     "deploy-lib": "@kamisiro/deploy-cli/es",
        //   }
        // }],
      ]
    },
  }
}
