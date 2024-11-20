import AbstractCosServiceImpl from './abstractCosServiceImpl';
import { CosTempAuthType, CosType } from '@/types/type';
import fs from 'fs';
import Cos from 'ali-oss';

export default class AliyunCosServiceImpl extends AbstractCosServiceImpl {
  protected COS_UPLOAD_PATH = '/';
  protected tempAuthData: CosTempAuthType | null = null;
  protected BUCKET = '';
  protected REGION = '';
  protected COS_TYPE = 'aliyun';
  protected cosInstance: Cos | null = null;

  async init(cosInfo?: CosType): Promise<any> {
    const res = await super.init(cosInfo);
    console.log(res, 'res');
    console.log(Cos, 'cos', this.COS_TYPE);
    this.cosInstance = new Cos({
      accessKeyId: cosInfo?.getTempAuthInfo ? res.tmpSecretId : cosInfo?.secretId,
      // stsToken: cosInfo?.getTempAuthInfo ? res.token : null,
      accessKeySecret: cosInfo?.getTempAuthInfo ? res.tmpSecretKey : cosInfo?.secretKey,
      bucket: this.BUCKET,
      region: this.REGION,
    });
    return true;
  }

  removeFile(fileKey: string) {
    return this.cosInstance!.delete(this.COS_UPLOAD_PATH + fileKey)
      .then((res: any) => {
        console.log('data :', res);
      })
      .catch((err: any) => {
        console.log('err: ', err);
      });
  }

  uploadFile(fileName: string, path: string) {
    return this.cosInstance!.put(this.COS_UPLOAD_PATH + fileName, fs.createReadStream(path))
      .then((res: any) => {
        console.log('data :', res);
      })
      .catch((err: any) => {
        console.log('err: ', err);
      });
  }
}
