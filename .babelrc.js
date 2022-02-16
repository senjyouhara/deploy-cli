const packageJson = require('./package.json')

module.exports = {
  comments: false,
  presets: [
    [
      '@babel/preset-env',
      {
        modules: 'cjs',
        targets: {
          esmodules: true,
        },
      },
    ],
    "@babel/preset-typescript"
  ],
  plugins: [
    '@babel/plugin-external-helpers',
    '@babel/plugin-transform-runtime',
    // ["module-resolver", {
    //   "root": ["./"],
    //   "alias": {
    //     "@": "@kamisiro/deploy-cli/lib",
    //   }
    // }],
    ["define-patterns", {
      "replacements": {
        "process.env.NODE_ENV": process.env.NODE_ENV,
        "process.env.PKG_VERSION": packageJson.version,
        "process.env.NAME": packageJson.name,
      }
    }]
  ],
  "env": {
    "component": {
      "presets": [
        [
          '@babel/preset-env',
          {
            modules: false,
            targets: {
              esmodules: true,
            },
          },
        ],
      ],
      "plugins": [
      ]
    },
  }
}
