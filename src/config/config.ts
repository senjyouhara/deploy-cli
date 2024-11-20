import fs from 'fs';
import os from 'os';
import { getFileName, join } from '@/util';
import { ConfigOptions, PathInfoType } from '@/types/type';
import { buildType, runScriptType } from '@/service/build/buildService';
import { error, succeed } from '@/util/oraUtil';

function getUserPackage() {
  return join(process.cwd(), 'package.json');
}

export const platformConfig = [
  {
    type: 'input',
    name: 'projectName',
    message: '项目名称',
    default: fs.existsSync(getUserPackage()) ? JSON.parse(fs.readFileSync(getUserPackage(), 'utf-8')).name : '',
  },
  {
    type: 'input',
    name: 'platformName',
    message: '环境名称',
    validate(input: string) {
      const platformName = input.trim();
      // @ts-ignore
      let done = this.async();
      if (
        fs.existsSync(`${join(process.cwd(), getFileName(platformName), '.ts')}`) ||
        fs.existsSync(`${join(process.cwd(), getFileName(platformName), '.js')}`)
      ) {
        done('该环境的配置文件已存在，请确认');
        setTimeout(() => {
          process.exit(-1);
        }, 200);
        return;
      }
      done(null, true);
    },
  },
  {
    type: 'input',
    name: 'script',
    message: '打包命令',
    default: 'npm run build',
  },
  {
    type: 'confirm',
    name: 'isInstall',
    message: '是否调用打包命令前执行npm i',
    default: true,
  },
  {
    type: 'input',
    name: 'postScript',
    message: '打包执行完成后后置命令',
    when: () => false,
  },
  {
    type: 'input',
    name: 'host',
    message: '服务器地址',
    validate(input: string) {
      if (
        /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.test(
          input,
        )
      ) {
        return true;
      }

      return 'ip格式不正确';
    },
  },
  {
    type: 'number',
    name: 'port',
    message: '服务器端口号',
    default: 22,
    validate(input: string) {
      const n = Number(input);
      if (isNaN(n)) {
        return '端口号不正确';
      }

      if (!(n >= 1 && n <= 65535)) {
        return '端口号必须为1-65535这个范围之内';
      }

      return true;
    },
  },
  {
    type: 'input',
    name: 'username',
    message: '用户名',
  },
  {
    type: 'password',
    name: 'password',
    message: '密码(和私钥二选一)',
  },
  {
    type: 'input',
    name: 'privateKey',
    message: '本地私钥路径(和密码二选一)',
    default: join(os.homedir(), '.ssh', 'id_rsa'),
  },
  {
    type: 'password',
    name: 'passphrase',
    message: '本地私钥密码(如果私钥没设密码留空即可)',
  },
  {
    type: 'confirm',
    name: 'isUseTempCosAuth',
    message: '是否使用临时cos秘钥进行cos上传(如果为true则不需要填写secretId和secretKey)',
    default: false,
  },
  {
    type: 'input',
    name: 'secretId',
    message: 'cosSecretId(如果填写该项目则为cdn项目)',
  },
  {
    type: 'input',
    name: 'secretKey',
    message: 'cosSecretKey(如果填写该项目则为cdn项目)',
  },
  {
    type: 'input',
    name: 'cosType',
    message: 'cos类型',
    default: 'tencent',
    when: () => false,
  },
  {
    type: 'input',
    name: 'bucket',
    message: 'cos桶名称',
  },
  {
    type: 'input',
    name: 'region',
    message: 'cos地域',
  },
  {
    type: 'input',
    name: 'cosUploadPath',
    message: 'cos上传目录',
  },
  {
    type: 'confirm',
    name: 'isRemoveCosFile',
    message: '是否上传到cos之前先清除原本目录',
    default: false,
  },
  {
    type: 'input',
    name: 'outputPath',
    message: '本地打包生成目录',
    default: 'dist',
  },
  {
    type: 'input',
    name: 'serverPath',
    message: '服务器部署路径',
  },
  {
    type: 'confirm',
    name: 'isBakFile',
    message: '是否备份服务器原文件',
    default: false,
  },
  {
    type: 'input',
    name: 'bakFileName',
    message: '备份的文件名(如为空则默认生成)',
  },
  {
    type: 'confirm',
    name: 'isRemoveServerFile',
    message: '是否部署前先删除服务器原文件',
    default: true,
  },
  {
    type: 'input',
    name: 'serverScript',
    when: () => false,
    message: '执行服务器脚本',
  },
];

export const deployHooks = [
  {
    start(config: ConfigOptions) {
      succeed(`项目部署开始 ${config.projectName}`);
    },
    preInstall(config: ConfigOptions, pack: PathInfoType) {
      succeed(`开始 ${pack.path} 目录安装依赖 `);
    },
    postInstall(config: ConfigOptions, pack: PathInfoType, type: string, success: boolean) {
      if (success) {
        succeed(`${pack.path} 目录依赖安装完成`);
      } else {
        error(`${pack.path} 目录依赖安装失败`);
      }
    },
    preBuild(config: ConfigOptions, runScript: runScriptType) {
      succeed(`在 ${runScript.path} 目录开始执行打包命令`);
    },
    postBuild(config: ConfigOptions, runScript: runScriptType, result: buildType) {
      succeed(`在 ${runScript.path} 目录编译完成生成压缩文件 ${result.filePath}`);
    },
    preCos(config: ConfigOptions, uploadData: buildType) {
      succeed(`${uploadData.fileName}目录文件 开始上传到COS`);
    },
    postCos(config: ConfigOptions, uploadData: buildType) {
      succeed(`${uploadData.fileName}目录文件 上传COS完成`);
    },
    preConnectServer(config: ConfigOptions) {
      succeed(`开始连接服务器 ${config.host}:${config.port}`);
    },
    connectServerSuccess(config: ConfigOptions) {
      succeed(`服务器连接成功 ${config.host}:${config.port}`);
    },
    preDeploy(config: ConfigOptions, buildData: buildType) {
      succeed(`开始部署 ${buildData.fileName}.zip 到服务器 `);
    },
    postDeploy(config: ConfigOptions, buildData: buildType, remoteDir: string) {
      succeed(`部署 ${buildData.fileName}.zip 到服务器完成 部署目录 ${remoteDir}`);
    },
    closeServer(config: ConfigOptions) {
      succeed(`关闭服务器连接 ${config.host}:${config.port}`);
    },
    finish(config: ConfigOptions) {
      succeed(`项目部署完成 ${config.projectName}`);
    },
  },
];

export const deployHooksUtils = {
  run(keyName: string, ...args: any) {
    const preFilter = deployHooks.filter(v => Object.keys(v).includes(keyName));
    preFilter.forEach(v => v[keyName](...args));
  },
};

export const defineConfig = (config: ConfigOptions) => config;
