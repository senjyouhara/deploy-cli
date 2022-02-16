import CosService from './cosService'
import { CosType } from '../../types/type'

export default abstract class AbstractCosServiceImpl implements CosService {
  protected cosInstance: any = null
  protected cosInfo: CosType | null = null

  setCosInfo(cosInfo: CosType) {
    this.cosInfo = cosInfo
  }

  async batchRemoveFile(list: string[]): Promise<any> {
    for (let item of list) {
      await this.removeFile(item)
    }
  }

  async batchUploadFile(list: { fileName: string; path: string }[]): Promise<any> {
    for (let item of list) {
      await this.uploadFile(item.fileName, item.path)
    }
  }

  abstract removeFile(fileKey: string): void

  abstract uploadFile(filePath: string, path: string): void

  abstract init(cosInfo?: CosType): void
}
