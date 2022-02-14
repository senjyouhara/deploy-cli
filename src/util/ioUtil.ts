import fs from 'fs'

export const saveFile = (path: string, data: string | NodeJS.ArrayBufferView) => {
  fs.writeFileSync(path, data, { encoding: 'utf8' })
}

export const readLocalFile = (path: string, fn: (str: string) => string) => {
  let f = fs.readFileSync(path, 'utf-8')
  f = fn(f)
  return new Function('return (' + f + ')')()
}

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
