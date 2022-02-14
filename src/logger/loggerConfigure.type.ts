import { Configuration, Appender, Logger, configure, getLogger } from 'log4js'
import path from 'path'
import { resolve } from '@/util'

export const loggerFilename = resolve('./logs')
export const appenderFilename = `${loggerFilename}/logger`

export interface AppenderConfigureItem {
  name: string
  option: Appender
}

export interface CategoriesDefault {
  appenders: string[]
  level: string
}

export class LoggerConfigure implements Configuration {
  appenders: any = {}
  categories: any = {}

  constructor(appenderConfigureList: AppenderConfigureItem[]) {
    const appenders: string[] = appenderConfigureList.map(item => item.name || 'dev')
    const defaultOption: Appender = {
      filename: appenderFilename,
      type: 'dateFile',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      backups: 30,
    }
    appenderConfigureList.forEach(item => {
      this.appenders[item.name] = Object.assign({}, defaultOption, item.option)
    })

    const categoriesDefault: CategoriesDefault = {
      appenders,
      level: 'debug',
    }
    this.categories = {
      default: categoriesDefault,
    }
  }
}

export class PrintLogger {
  logger: Logger | any
  constructor(loggerConfigure: LoggerConfigure) {
    configure(loggerConfigure)
    const logger = getLogger()
    this.logger = Object.assign(logger, { print: this.print.bind(this) })
  }
  print(level: string, message: any, ...args: any[]): void {
    console.log(message, ...args)
    const levels: string[] = ['info', 'warn', 'error', 'debug', 'trace', 'mark', 'fatal']
    const isLevel: boolean = levels.includes(level)
    isLevel ? this.logger[level](message, ...args) : this.logger.info(message, ...args)
  }
}
