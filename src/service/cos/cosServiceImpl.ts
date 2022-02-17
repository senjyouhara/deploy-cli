import AbstractDeployComponentService from '../abstractDeployComponentService'
import CosService from './cosService'
import { ConfigOptions, CosType } from '../../types/type'
import TencentCosServiceImpl from './tencentCosServiceImpl'
import { deployHooksUtils } from '../../config/config'
import { info } from '../../util/oraUtil'
import { buildType } from '../build/buildService'

export type cosUploadType = { fileName: string; path: string }
export default class CosServiceImpl extends AbstractDeployComponentService {
  serviceList: CosService[] = []
  config: ConfigOptions | null = null
  checkConfig(config: ConfigOptions): { flag: boolean; data: any } {
    if (config?.secretId || config?.isUseTempCosAuth) {
      this.config = config
      return { data: null, flag: true }
    }

    info('未指定cos相关信息，将跳过cos操作')
    return { data: undefined, flag: false }
  }

  async exec(data: buildType[]): Promise<void> {
    if (!this.config) {
      return
    }

    const cosInfo: CosType = {
      secretId: this.config.secretId,
      secretKey: this.config.secretKey,
      isUseTempCosAuth: this.config.isUseTempCosAuth,
      isRemoveCosFile: this.config.isRemoveCosFile,
    }

    for (let item of this.serviceList) {
      await item.init(cosInfo)
    }

    for (let v of this.serviceList) {
      for (let item of data) {
        deployHooksUtils.run('preCos', this.config, item)
        if (this.config.isRemoveCosFile) {
          await v.batchRemoveFile([item.fileName])
        }
        await v.batchUploadFile(
          item.waitUploadStaticFileList.map(w => ({
            path: w.path,
            fileName: item.fileName + '/' + w.pathName,
          })),
        )
        deployHooksUtils.run('postCos', this.config, item)
      }
    }
  }

  init(data: any): void {
    const tencentCosServiceImpl = new TencentCosServiceImpl()
    this.serviceList.push(tencentCosServiceImpl)
  }
}
