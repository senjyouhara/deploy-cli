import NpmInstallServiceImpl from './npmInstallServiceImpl';
import PnpmInstallServiceImpl from './pnpmInstallServiceImpl';
import YarnInstallServiceImpl from './yarnInstallServiceImpl';
import InstallService from './installService';
import { error, info, loading, succeed } from '@/util/oraUtil';
import AbstractDeployComponentService from '../abstractDeployComponentService';
import { ConfigOptions, PathInfoType } from '@/types/type';
// @ts-ignore
import CMD from 'node-cmd';
import { deployHooks, deployHooksUtils } from '@/config/config';
import { log } from '@/util';

export default class InstallServiceImpl extends AbstractDeployComponentService implements InstallService {
  currentService: InstallService;
  service: InstallService;
  config: ConfigOptions | null = null;
  installType = '';

  constructor() {
    super();
    let npmInstallServiceImpl = new NpmInstallServiceImpl();
    let pnpmInstallServiceImpl = new PnpmInstallServiceImpl();
    let yarnInstallServiceImpl = new YarnInstallServiceImpl();

    npmInstallServiceImpl.setNext(yarnInstallServiceImpl);
    yarnInstallServiceImpl.setNext(pnpmInstallServiceImpl);

    this.currentService = npmInstallServiceImpl;
    this.service = npmInstallServiceImpl;
  }

  checkConfig(config: ConfigOptions): { flag: boolean; data: any } {
    if (!config || !config.install) {
      return { flag: false, data: null };
    }

    if (typeof config.install == 'string') {
      this.installType = config.install;
    }
    this.config = config;

    return { flag: true, data: null };
  }

  // @ts-ignore
  async exec(packages: PathInfoType[]): Promise<any> {
    log('packages: ', packages);

    for (const v of packages) {
      if (v.name === 'root') {
        continue;
      }
      deployHooksUtils.run('preInstall', this.config!, v);
      process.chdir(v.path);
      const err = await this.currentService.exec();
      if (err) {
        log('error: ', err);
        process.exit(1);
      }

      deployHooksUtils.run('postInstall', this.config!, v, this.currentService.getType(), !err);
    }
  }

  getNext(): InstallService | undefined {
    return this.currentService.getNext();
  }

  getType(): string {
    return this.currentService.getType();
  }

  getSupportChild(service: InstallService): InstallService | null {
    if (!service) {
      return null;
    }

    if (service.getType() && service.getType().toLocaleLowerCase() == this.installType.toLocaleLowerCase()) {
      return service;
    }
    let result = this.getSupportChild(service.getNext()!);

    if (result && result.isSupport()) {
      if (result.isLockFile()) {
        return result;
      }
    }

    return service;
  }

  supportHandler() {
    this.currentService = this.service;

    let service = this.getSupportChild(this.currentService);

    if (!service! || !service.isSupport()) {
      error('没有支持进行install的工具，请检查');
      process.exit(1);
    }

    this.currentService = service;

    return service;
  }

  isSupport(): boolean {
    return this.currentService.isSupport();
  }

  init(config: any): any {
    this.supportHandler();
  }
}
