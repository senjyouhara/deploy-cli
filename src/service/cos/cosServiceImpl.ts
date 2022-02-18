import AbstractDeployComponentService from '../abstractDeployComponentService'
import CosService from './cosService'
import { ConfigOptions, CosType } from '../../types/type'
import TencentCosServiceImpl from './tencentCosServiceImpl'
import AliyunCosServiceImpl from './aliyunCosServiceImpl'
import { deployHooksUtils } from '../../config/config'
import { info } from '../../util/oraUtil'
import { buildType } from '../build/buildService'
import AbstractCosServiceImpl from './abstractCosServiceImpl'

export type cosUploadType = { fileName: string; path: string }
export default class CosServiceImpl extends AbstractDeployComponentService {
  serviceList: AbstractCosServiceImpl[] = []
  config: ConfigOptions | null = null
  checkConfig(config: ConfigOptions): { flag: boolean; data: any } {
    if (config?.secretId || config?.getTempAuthInfo) {
      if (!config.cosType) {
        config.cosType = 'tencent'
      }
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

    let service: AbstractCosServiceImpl

    for (let item of this.serviceList) {
      if (item.getType() == this.config.cosType) {
        service = item
        await item.init(this.config)
        break
      }
    }

    for (let item of data) {
      deployHooksUtils.run('preCos', this.config, item)
      if (this.config.isRemoveCosFile) {
        await service!.batchRemoveFile([item.fileName])
      }
      await service!.batchUploadFile(
        item.waitUploadStaticFileList.map(w => ({
          path: w.path,
          fileName: item.fileName + '/' + w.pathName,
        })),
      )
      deployHooksUtils.run('postCos', this.config, item)
    }
  }

  init(data: any): void {
    const tencentCosServiceImpl = new TencentCosServiceImpl()
    const aliyunCosServiceImpl = new AliyunCosServiceImpl()
    this.serviceList.push(tencentCosServiceImpl)
    this.serviceList.push(aliyunCosServiceImpl)
  }
}
