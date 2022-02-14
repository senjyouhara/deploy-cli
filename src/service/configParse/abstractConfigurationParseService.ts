import fs from 'fs'
import path from 'path'

export default abstract class AbstractConfigurationParseService {
  constructor() {}
  protected packages: string[] = []
  protected file: any = null
  abstract readFile(filePath: string, fileName: string): void

  currentPath = process.cwd() + path.sep

  packagesParseHandle() {
    const packageFiles: { name: string; path: string }[] = []
    for (let packagename of this.packages) {
      if (packagename.includes('*')) {
        const dir = packagename.replace(/\/\*+/, '')
        const dirList = fs.readdirSync(this.currentPath + packagename.replace(/\/\*+/, ''))
        packageFiles.push(
          ...dirList.map(s => ({ name: dir + path.sep + s, path: this.currentPath + dir + path.sep + s })),
        )
      } else {
        packageFiles.push({ name: packagename, path: this.currentPath + packagename })
      }
    }
    return packageFiles
  }

  abstract getType(): string
  abstract getFilePath(): string
  abstract getFileName(): string
  getFile() {
    return this.file
  }
}
