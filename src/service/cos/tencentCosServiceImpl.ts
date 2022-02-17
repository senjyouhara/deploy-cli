import AbstractCosServiceImpl from './abstractCosServiceImpl'
import { CosTempAuthType, CosType } from '../../types/type'
import Cos from 'cos-nodejs-sdk-v5'
import { error } from '../../util/oraUtil'
import fs from 'fs'
import { getCosInfo } from '../../api/authApi'
import {log} from "../../util";

export default class TencentCosServiceImpl extends AbstractCosServiceImpl {
  COS_UPLOAD_PATH = '/web/temp/'
  tempAuthData: CosTempAuthType | null = null
  BUCKET = 'test-1253492636'
  REGION = 'ap-guangzhou'
  async init(cosInfo?: CosType): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      if (cosInfo?.isUseTempCosAuth) {
        this.tempAuthData = await getCosInfo()
        if (!this.tempAuthData) {
          error('cos信息无效')
          process.exit(1)
        }
        this.BUCKET = this.tempAuthData.bucket
        this.REGION = this.tempAuthData.region
      }

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this
      this.cosInstance = new Cos(
        cosInfo?.isUseTempCosAuth
          ? {
              getAuthorization(options, callback) {
                callback({
                  TmpSecretId: that.tempAuthData!.tmpSecretId, // 临时密钥的 tmpSecretId
                  TmpSecretKey: that.tempAuthData!.tmpSecretKey, // 临时密钥的 tmpSecretKey
                  SecurityToken: that.tempAuthData!.token, // 临时密钥的 sessionToken
                  ExpiredTime: that.tempAuthData!.expiredTime, // 临时密钥失效时间戳，是申请临时密钥时，时间戳加 durationSeconds
                  StartTime: that.tempAuthData!.startTime, // 临时密钥失效时间戳，是申请临时密钥时，时间戳加 durationSeconds
                })
              },
            }
          : {
              SecretId: cosInfo?.secretId,
              SecretKey: cosInfo?.secretKey,
            },
      )
      resolve(true)
    })
  }

  removeFile(fileKey: string) {
    return this.cosInstance
      .deleteObject({
        Bucket: this.BUCKET,
        Region: this.REGION,
        Key: this.COS_UPLOAD_PATH + fileKey,
      })
      .then(function (data: any) {
        log(`data: `, data)
      })
  }

  uploadFile(fileName: string, path: string) {
    return this.cosInstance
      .putObject({
        Bucket: this.BUCKET,
        Region: this.REGION,
        Key: this.COS_UPLOAD_PATH + fileName,
        StorageClass: 'STANDARD',
        Body: fs.createReadStream(path), // 上传文件对象
        onProgress: function (progressData: any) {
          log(`progressData: ${progressData}`)
        },
      })
      .then(function (data: any) {
        log(`data: `, data)
      })
  }
}
