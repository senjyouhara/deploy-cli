import { platformConfig } from '../config/config'
import { ConfigOptions, InitCommandType } from '../types/type'
import inquirer from 'inquirer'
import ConfigProcessService from '../service/configProcessService'
import BaseCommand from './baseCommand'
import fs from 'fs'
import path from 'path'
import { getFileName, join } from '../util'
import { error } from '../util/oraUtil'

export default class InitCommand implements BaseCommand {
  configProcessService: ConfigProcessService = new ConfigProcessService()
  commandName = 'init'
  allowConfigNames = ['d']
  commandDesc = [
    {
      command: this.commandName,
      desc: '通过命令行创建文件',
    },
    {
      command: this.commandName + ' -d',
      desc: '静默创建默认文件',
    },
  ]

  run(commandName: string, args: any) {
    if (commandName != this.commandName) {
      return false
    }

    let obj: any = {}

    for (let j = 0; j < this.allowConfigNames.length; j++) {
      if (args[this.allowConfigNames[j]] != null) {
        obj[this.allowConfigNames[j]] = args[this.allowConfigNames[j]]
      }
    }

    this.exec(obj)
    return true
  }

  exec(obj: InitCommandType) {
    if (!obj.d) {
      inquirer
        .prompt(platformConfig)
        .then(this.configProcessService.checkConfig)
        .then(this.configProcessService.createJsonObjectStr)
        .then(this.configProcessService.saveFile)
      return
    }

    const data = platformConfig.reduce((t, c) => {
      if (!t[c.name]) {
        t[c.name] = c.default || ''
      }
      return t
    }, {}) as ConfigOptions

    this.configHandler(data)
  }

  configHandler(data: ConfigOptions) {
    if (
      fs.existsSync(`${join(process.cwd(), getFileName(data.platformName), '.ts')}`) ||
      fs.existsSync(`${join(process.cwd(), getFileName(data.platformName), '.js')}`)
    ) {
      error('该环境的配置文件已存在，请确认')
      process.exit(-1)
      return
    }

    this.configProcessService
      .checkConfig(data)
      .then(this.configProcessService.createJsonObjectStr)
      .then(this.configProcessService.saveFile)
  }

  getCommandDesc(): { command: string; desc: string }[] {
    return this.commandDesc
  }

  getCommandName(): string {
    return this.commandName
  }
}
