import { error } from '../../util/oraUtil'
import AbstractConfigurationParseService from './abstractConfigurationParseService'

export default class LernaConfigurationParseService extends AbstractConfigurationParseService {
  type = 'lerna'
  filePath = ''
  fileName = ''
  packages: string[] = []

  readFile(filePath: string, fileName: string) {
    this.filePath = filePath
    this.fileName = fileName
    try {
      this.file = require(filePath)
      this.packages = (this.file && this.file.packages) || (this.file && this.file.workspaces) || []
    } catch (e) {
      error(`文件读取失败，请检查${fileName}文件`)
    }
  }

  getType(): string {
    return this.type
  }

  getFilePath(): string {
    return this.filePath
  }

  getFileName(): string {
    return this.fileName
  }
}
