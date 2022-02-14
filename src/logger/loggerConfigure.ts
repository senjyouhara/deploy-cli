import { AppenderConfigureItem, LoggerConfigure, appenderFilename } from './loggerConfigure.type'

const appenderConfigureList: AppenderConfigureItem[] = [
  {
    name: 'logger',
    option: {
      type: 'dateFile',
      filename: appenderFilename,
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      backups: 30,
    },
  },
]

export const loggerConfigure = new LoggerConfigure(appenderConfigureList)
