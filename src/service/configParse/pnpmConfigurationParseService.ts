import AbstractConfigurationParseService from './abstractConfigurationParseService';
import { error } from '@/util/oraUtil';
import fs from 'fs';
import yaml from 'js-yaml';

export default class PNPMConfigurationParseService extends AbstractConfigurationParseService {
  type = 'PNPM';
  filePath = '';
  fileName = '';
  packages: string[] = [];

  readFile(filePath: string, fileName: string) {
    this.filePath = filePath;
    this.fileName = fileName;
    try {
      let content = fs.readFileSync(filePath, { encoding: 'utf8' });
      this.file = yaml.load(content);
      this.packages = (this.file && this.file.packages) || [];
    } catch (e) {
      error(`文件读取失败，请检查${fileName}文件`);
    }
  }

  getType(): string {
    return this.type;
  }

  getFilePath(): string {
    return this.filePath;
  }

  getFileName(): string {
    return this.fileName;
  }
}
