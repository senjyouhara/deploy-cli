import NpmInstallServiceImpl from './npmInstallServiceImpl'
import PnpmInstallServiceImpl from './pnpmInstallServiceImpl'
import YarnInstallServiceImpl from './yarnInstallServiceImpl'
import InstallService from './installService'
import { error, info, loading, succeed } from '../../util/oraUtil'
import AbstractDeployComponentService from '../abstractDeployComponentService'
import { ConfigOptions, PathInfoType } from '../../types/type'
// @ts-ignore
import CMD from 'node-cmd'
import { deployHooks, deployHooksUtils } from '../../config/config'
import { log } from '../../util'

export default class InstallServiceImpl extends AbstractDeployComponentService implements InstallService {
  currentService: InstallService
  service: InstallService
  config: ConfigOptions | null = null
  installType = ''

  constructor() {
    super()
    var npmInstallServiceImpl = new NpmInstallServiceImpl()
    var pnpmInstallServiceImpl = new PnpmInstallServiceImpl()

    npmInstallServiceImpl.setNext(pnpmInstallServiceImpl)

    this.currentService = npmInstallServiceImpl
    this.service = npmInstallServiceImpl
  }

  checkConfig(config: ConfigOptions): { flag: boolean; data: any } {
    if (!config || !config.install) {
      return { flag: false, data: null }
    }

    if (typeof config.install == 'string') {
      this.installType = config.install
    }
    this.config = config

    return { flag: true, data: null }
  }

  // @ts-ignore
  async exec(packages: PathInfoType[]): Promise<any> {
    log(`packages: `, packages)
    for (const v of packages) {
      deployHooksUtils.run('preInstall', this.config!, v)
      this.currentService = this.service

      const service = this.supportHandler()
      process.chdir(v.path)
      const err = await service.exec()
      if (err) {
        log(`error: `, err)
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

  getSupportChild(service: InstallService): InstallService | null {
    if (!service) {
      return null
    }

    if (this.installType && service.getType() == this.installType) {
      return service
    }

    if (service.getNext()) {
      let result = service

      // eslint-disable-next-line no-unmodified-loop-condition
      while (result && result.isSupport()) {
        if (result.isLockFile()) {
          return result
        } else {
          result = this.getSupportChild(result.getNext()!)!
          if (this.installType && result.getType() == this.installType) {
            return result
          }
        }
      }
    }

    return service
  }

  supportHandler() {
    let service = this.getSupportChild(this.currentService)

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
