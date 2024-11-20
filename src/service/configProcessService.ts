import { saveFile } from '@/util/ioUtil';
import { ConfigOptions } from '@/types/type';
import { getFileName, join, log } from '@/util';
import { loading } from '@/util/oraUtil';
import chalk from 'chalk';
import { platformConfig } from '@/config/config';

export default class ConfigProcessService {
  checkConfig(answer: ConfigOptions) {
    log('answer: ', answer);

    platformConfig
      .filter(v => v.default instanceof Boolean)
      .map(v => ({ name: v.name }))
      .forEach(v => {
        if (!answer[v.name]) {
          answer[v.name] = false;
        }
      });

    return Promise.resolve(answer);
  }

  createJsonObjectStr(data: ConfigOptions) {
    return Promise.resolve(data);
  }

  saveFile(json: ConfigOptions) {
    const spinner = loading('正在生成配置文件...');
    const requireStr = `import { defineConfig } from '${process.env.NAME}'`;
    const exportStr = `${requireStr}\nexport default defineConfig(${JSON.stringify(json, null, 2)})`;

    const filePath = join(process.cwd(), `${getFileName(json.platformName)}.ts`);
    const fileData = `${exportStr}`;
    saveFile(filePath, fileData);
    spinner.succeed(chalk.green('生成完成, 请进行查看...'));
  }
}
