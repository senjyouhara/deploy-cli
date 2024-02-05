import fs from 'fs'
import vm from 'vm'
// @ts-ignore
import * as babel from '@babel/core'
import { log } from './index'
export const saveFile = (path: string, data: string | NodeJS.ArrayBufferView) => {
  fs.writeFileSync(path, data, { encoding: 'utf8' })
}

// export const readLocalFile = (path: string) => {
//   const options = {
//     presets: [
//       [
//         '@babel/preset-env',
//         {
//           modules: 'cjs',
//           targets: {
//             esmodules: true,
//           },
//         },
//       ],
//       '@babel/preset-typescript',
//     ],
//     // plugins: ['@babel/plugin-external-helpers', '@babel/plugin-transform-runtime'],
//   }
//   const data = babel.transformFileSync(path, options).code
//   const wrapper = ['(function(exports, require, module, __filename,__dirname){', '})']
//   let fnStr = wrapper[0] + data + wrapper[1]
//   log(data, 'code')
//   let wrapperFn = vm.runInThisContext(fnStr)
//   let value = {}
//   wrapperFn.call(value, require, value, __filename, __dirname)
//   log(value, 'data')
//   return value
// }

export function deleteFolder(path: string) {
  let files = []
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path)
    files.forEach(function (file, index) {
      let curPath = path + '/' + file
      if (fs.statSync(curPath).isDirectory()) {
        deleteFolder(curPath)
      } else {
        fs.unlinkSync(curPath)
      }
    })
    fs.rmdirSync(path)
  }
}
