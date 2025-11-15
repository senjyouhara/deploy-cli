import DeployService from '../service/deployService';
import BaseCommand from './baseCommand';
import { DeployCommandType } from '@/types/type';

export default class DeployCommand implements BaseCommand {
  deployService: DeployService = new DeployService();
  commandName = 'deploy';
  allowConfigNames: DeployCommandType = {
    mode: '',
    projectName: '',
    platformName: '',
    script: '',
    install: false,
    postScript: '',
    outputPath: '',
    host: '',
    port: 0,
    username: '',
    password: '',
    privateKey: '',
    passphrase: '',
    cosType: 'tencent',
    bucket: '',
    region: '',
    cosUploadPath: '',
    isRemoveCosFile: false,
    serverPath: '',
    isBakFile: false,
    bakFileName: '',
    isRemoveServerFile: false,
    serverScript: '',
  };
  commandDesc = [
    {
      command: this.commandName,
      desc: '部署默认环境应用',
    },
    {
      command: `${this.commandName} --mode=dev`,
      desc: '部署默认环境dev分支',
    },
    {
      command: `${this.commandName} --mode=dev --host=127.0.0.1 --port=22 --username=root --password=123 --privateKey=key --passphrase=123`,
      desc: '部署默认环境dev分支,并且可通过参数注入覆盖配置文件内部的配置',
    },
  ];

  run(commandName: string, args: any) {
    if (commandName != this.commandName) {
      return false;
    }

    let obj: any = {};

    for (let j in this.allowConfigNames) {
      if (args[j] != null) {
        obj[j] = args[j];
      }
    }

    this.exec(obj);
    return true;
  }

  exec(obj: DeployCommandType) {
    const newObj: any = {};
    Object.keys(this.allowConfigNames).forEach(item => {
      if (obj[item as keyof DeployCommandType]) {
        newObj[item] = obj[item as keyof DeployCommandType];
      }
    });

    this.deployService.run(newObj);
  }

  getCommandDesc(): { command: string; desc: string }[] {
    return this.commandDesc;
  }

  getCommandName(): string {
    return this.commandName;
  }
}
