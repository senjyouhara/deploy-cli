import NpmInstallServiceImpl from '@/service/install/npmInstallServiceImpl'
import PnpmInstallServiceImpl from '@/service/install/pnpmInstallServiceImpl'
import YarnInstallServiceImpl from '@/service/install/yarnInstallServiceImpl'
import InstallService from '@/service/install/installService'
import { error, info, loading, succeed } from '@/util/oraUtil'
import AbstractDeployComponentService from '@/service/abstractDeployComponentService'
import { ConfigOptions, PathInfoType } from '@/types/type'
import { logger } from '@/logger'
// @ts-ignore
import CMD from 'node-cmd'
import { deployHooks, deployHooksUtils } from '@/config/config'

export default class InstallServiceImpl extends AbstractDeployComponentService implements InstallService {
  service: InstallService
  config: ConfigOptions | null = null

  constructor() {
    super()
    var npmInstallServiceImpl = new NpmInstallServiceImpl()
    var yarnInstallServiceImpl = new YarnInstallServiceImpl()
    var pnpmInstallServiceImpl = new PnpmInstallServiceImpl()

    npmInstallServiceImpl.setNext(yarnInstallServiceImpl)
    yarnInstallServiceImpl.setNext(pnpmInstallServiceImpl)

    this.service = npmInstallServiceImpl
  }

  checkConfig(config: ConfigOptions): { flag: boolean; data: any } {
    if (!config || !config.isInstall) {
      return { flag: false, data: null }
    }

    this.config = config

    return { flag: true, data: null }
  }

  // @ts-ignore
  async exec(packages: PathInfoType[]): Promise<any> {
    logger.info(`packages: ${JSON.stringify(packages)}`)
    for (const v of packages) {
      deployHooksUtils.run('preInstall', this.config!, v)

      const service = this.supportHandler(true)
      CMD.runSync('cd ' + v.path)
      const err = await service.exec()
      if (err) {
        logger.print('error', `err:${JSON.stringify(err)}`)
        process.exit(1)
      }

      deployHooksUtils.run('postInstall', this.config!, v, service.getType(), !err)
    }
  }

  getNext(): InstallService | undefined {
    return this.supportHandler().getNext()
  }

  getType(): string {
    return this.supportHandler().getType()
  }

  getSupportChild(service: InstallService, hasLockFile?: boolean): InstallService | null {
    if (!service) {
      return null
    }

    if (service.getNext()) {
      const result = this.getSupportChild(service.getNext()!, hasLockFile)
      if (result && result.isSupport()) {
        if (hasLockFile) {
          if (result.isLockFile()) {
            return result
          }
        } else {
          return result
        }
      }
    }

    return service
  }

  supportHandler(hasLockFile?: boolean) {
    let service = this.getSupportChild(this.service, hasLockFile)
    if (hasLockFile && !service) {
      service = this.getSupportChild(this.service)
    }

    if (!service || !service.isSupport()) {
      error('没有支持进行install的工具，请检查')
      process.exit(1)
    }

    return service
  }

  isSupport(): boolean {
    const service = this.supportHandler()
    return service.isSupport()
  }

  init(config: any): any {}
}
