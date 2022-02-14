module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        targets: {
          esmodules: true,
        },
      },
    ],
    // "@babel/preset-typescript"
  ],
  plugins: [
    '@babel/plugin-external-helpers',
    // '@babel/plugin-transform-runtime',
    // ["module-resolver", {
    //   "root": ["./"],
    //   "alias": {
    //     "@": "ibngli-deploy-cli/lib",
    //   }
    // }]
  ],
}
