import fs from 'fs';
import path from 'path';
import { join } from '@/util';

export default abstract class AbstractConfigurationParseService {
  protected packages: string[] = [];
  protected file: any = null;
  abstract readFile(filePath: string, fileName: string): void;

  currentPath = join(process.cwd());

  packagesParseHandle() {
    const packageFiles: { name: string; path: string }[] = [];
    for (let packagename of this.packages) {
      if (packagename.includes('*')) {
        const dir = packagename.replace(/\/\*+/, '');
        const dirList = fs.readdirSync(join(this.currentPath, packagename.replace(/\/\*+/, '')));
        packageFiles.push(...dirList.map(s => ({ name: join(dir, s), path: join(this.currentPath, dir, s) })));
      } else {
        packageFiles.push({ name: packagename, path: join(this.currentPath, packagename) });
      }
    }
    return packageFiles;
  }

  abstract getType(): string;
  abstract getFilePath(): string;
  abstract getFileName(): string;
  getFile() {
    return this.file;
  }
}
