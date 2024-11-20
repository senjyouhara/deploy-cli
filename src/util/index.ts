import path from 'path';
import fs from 'fs';
import map from './global';

export const getVersion = () => {
  return `V${process.env.PKG_VERSION}`;
};

export const DEFAULT_FILE_NAME = 'deploy.config';

export const getFileName = (platformName?: string) => (platformName && `${platformName}.`) + DEFAULT_FILE_NAME;

export const join = (...args: string[]): string => {
  return path.join(...args).replace(/\\+/g, '/');
};
export const resolve = (...args: string[]): string => {
  return path.resolve(...args).replace(/\\+/g, '/');
};

// 禁止服务端执行的命令脚本
export const notAllowedShellScript = [/rm\s+-rf.+/, /.+\.sh/];

export const scanPathList = (basePath: string) => {
  function _getScanPath(basePath: string, fullPath: string) {
    if (!fullPath || !fs.existsSync(fullPath)) {
      return [];
    }

    let list = [];

    let stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      const fileList = fs.readdirSync(fullPath, 'utf-8');
      fileList.forEach(v => {
        list.push(..._getScanPath(basePath, join(fullPath, v)));
      });
    } else {
      list.push({
        pathName: fullPath.replace(`${basePath}/`, '').replace(/\\+/g, '/'),
        path: fullPath.replace(/\\+/g, '/'),
        fileName: fullPath.slice(fullPath.lastIndexOf('/') + 1).replace(/\\+/g, '/'),
      });
    }

    return list;
  }

  return _getScanPath(basePath, basePath);
};

export function log(...args: any) {
  map.get('debug') && console.log(...args);
}
