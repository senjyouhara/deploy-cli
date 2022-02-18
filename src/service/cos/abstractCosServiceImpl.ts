import CosService from './cosService'
import { CosTempAuthType, CosType } from '../../types/type'
import { error } from '../../util/oraUtil'

export default abstract class AbstractCosServiceImpl implements CosService {
  protected cosInstance: any = null
  protected cosInfo: CosType | null = null
  protected COS_UPLOAD_PATH = '/'
  protected tempAuthData: CosTempAuthType | null = null
  protected BUCKET = ''
  protected REGION = ''
  protected COS_TYPE = ''

  getType() {
    return this.COS_TYPE
  }

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

  init(cosInfo?: CosType): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      if (!cosInfo?.bucket) {
        error('bucket信息未指定')
        process.exit(1)
      }
      if (!cosInfo?.region) {
        error('region信息未指定')
        process.exit(1)
      }
      if (!cosInfo?.cosUploadPath) {
        error('cos上传目录信息未指定')
        process.exit(1)
      }

      this.BUCKET = cosInfo?.bucket as string
      this.REGION = cosInfo?.region as string
      this.COS_UPLOAD_PATH = cosInfo?.cosUploadPath as string

      if (cosInfo?.getTempAuthInfo) {
        this.tempAuthData = await cosInfo?.getTempAuthInfo()
        if (!this.tempAuthData || !Object.keys(this.tempAuthData).length) {
          error('cos信息无效')
          process.exit(1)
        }
      } else {
        if (!cosInfo?.secretId) {
          error('secretId信息未指定')
          process.exit(1)
        }
        if (!cosInfo?.secretKey) {
          error('secretKey信息未指定')
          process.exit(1)
        }
      }

      resolve({
        ...this.tempAuthData,
        bucket: cosInfo?.bucket,
        region: cosInfo?.region,
        cosUploadPath: cosInfo?.cosUploadPath,
      })
    })
  }
}
