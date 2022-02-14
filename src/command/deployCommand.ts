import DeployService from '@/service/deployService'
import BaseCommand from '@/command/baseCommand'
import { DeployCommandType } from '@/types/type'

export default class DeployCommand implements BaseCommand {
  deployService: DeployService = new DeployService()
  commandName = 'deploy'
  allowConfigNames = ['mode', 'branch']
  commandDesc = [
    {
      command: this.commandName,
      desc: '部署默认环境应用',
    },
    {
      command: `${this.commandName} --mode=dev --branch=dev`,
      desc: '部署默认环境dev分支',
    },
    {
      command: `${this.commandName} --mode=ys --branch=acceptance`,
      desc: '部署ys环境acceptance分支',
    },
    {
      command: `${this.commandName} --mode=prod --branch=release`,
      desc: '部署prod环境release分支',
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

  exec(obj: DeployCommandType) {
    this.allowConfigNames.forEach(item => {
      if (!obj[item]) {
        obj[item] = ''
      }
    })

    this.deployService.run(obj)
  }

  getCommandDesc(): { command: string; desc: string }[] {
    return this.commandDesc
  }

  getCommandName(): string {
    return this.commandName
  }
}
