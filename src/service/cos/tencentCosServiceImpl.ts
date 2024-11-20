import AbstractCosServiceImpl from './abstractCosServiceImpl';
import { CosTempAuthType, CosType } from '@/types/type';
import fs from 'fs';
import { log } from '@/util';
import Cos from 'cos-nodejs-sdk-v5';

export default class TencentCosServiceImpl extends AbstractCosServiceImpl {
  protected COS_UPLOAD_PATH = '/';
  protected tempAuthData: CosTempAuthType | null = null;
  protected BUCKET = '';
  protected REGION = '';
  protected COS_TYPE = 'tencent';

  async init(cosInfo?: CosType): Promise<any> {
    const res = await super.init(cosInfo);
    console.log(res, 'res');
    console.log(Cos, 'cos', this.COS_TYPE);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    this.cosInstance = new Cos(
      cosInfo?.getTempAuthInfo
        ? {
            getAuthorization(options, callback) {
              callback({
                TmpSecretId: res.tmpSecretId, // 临时密钥的 tmpSecretId
                TmpSecretKey: res.tmpSecretKey, // 临时密钥的 tmpSecretKey
                SecurityToken: res.token, // 临时密钥的 sessionToken
                ExpiredTime: res.expiredTime, // 临时密钥失效时间戳，是申请临时密钥时，时间戳加 durationSeconds
                StartTime: res.startTime, // 临时密钥失效时间戳，是申请临时密钥时，时间戳加 durationSeconds
              });
            },
          }
        : {
            SecretId: res?.secretId,
            SecretKey: cosInfo?.secretKey,
          },
    );
    return true;
  }

  removeFile(fileKey: string) {
    return this.cosInstance
      .deleteObject({
        Bucket: this.BUCKET,
        Region: this.REGION,
        Key: this.COS_UPLOAD_PATH + fileKey,
      })
      .then((data: any) => {
        log('data: ', data);
      });
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
          log('progressData:', progressData);
        },
      })
      .then((data: any) => {
        log('data: ', data);
      });
  }
}
