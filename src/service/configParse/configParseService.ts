import AbstractDeployComponentService from '../abstractDeployComponentService';
import LernaConfigurationParseService from './lernaConfigurationParseService';
import PNPMConfigurationParseService from './pnpmConfigurationParseService';
import fs from 'fs';
import { info } from '@/util/oraUtil';
import AbstractConfigurationParseService from './abstractConfigurationParseService';
import { ConfigOptions, PathInfoType } from '@/types/type';
import { join, log, resolve } from '@/util';

export default class ConfigParseService extends AbstractDeployComponentService {
  init(data: any) {}
  configurationParseServiceList: AbstractConfigurationParseService[] = [];
  packages: PathInfoType[] = [];

  exec(): any {
    return this.packages;
  }

  checkConfig(config: ConfigOptions): { flag: boolean; data: any } {
    // 是否是lerna或pnpm项目
    const multipleConfigName = ['lerna.js', 'lerna.json', 'pnpm-workspace.yaml', 'pnpm-workspace.yml'];
    this.configurationParseServiceList = [new LernaConfigurationParseService(), new PNPMConfigurationParseService()];

    let fileList = multipleConfigName.filter(v => fs.existsSync(resolve(v)));

    fileList.forEach(v => {
      const find = this.configurationParseServiceList.find(
        s => v.includes(s.getType().toLocaleLowerCase()) && !s.getFile(),
      );
      if (find) {
        find.readFile(resolve(v), v);
      }
    });

    if (fileList.find(v => v.includes('lerna')) && fileList.find(v => v.includes('pnpm'))) {
      info('因项目同时包含pnpm和lerna，本cli将对2个进行合并处理');
    }

    this.packages = this.configurationParseServiceList.flatMap(v => v.packagesParseHandle());
    this.packages.unshift({ path: join(process.cwd()), name: 'root' });

    log('packages: ', this.packages);

    return { flag: true, data: this.packages };
  }
}
