import InitCommand from './initCommand'
import DeployCommand from './deployCommand'
import IBaseCommand from './baseCommand'
import { error } from '../util/oraUtil'

export default class Command {
  commandList: IBaseCommand[] = []

  constructor() {
    this.commandList.push(new InitCommand())
    this.commandList.push(new DeployCommand())

    const repeatObj: { [k: string]: number } = {}

    for (let i = 0; i < this.commandList.length; i++) {
      if (!this.commandList[i].getCommandName()) {
        error('command文件没有commandName参数，请检查')
        process.exit(-1)
      }

      if (!repeatObj[this.commandList[i].getCommandName()]) {
        repeatObj[this.commandList[i].getCommandName()] = 1
      } else {
        error(`commandName参数值【${this.commandList[i].getCommandName()}】有重名，请检查`)
        process.exit(-1)
      }
    }
  }

  getCommandDesc() {
    return this.commandList.flatMap(v => v.getCommandDesc())
  }

  execCommand(commandName: string, args: any) {
    let hasRun = false
    for (let command of this.commandList) {
      if (command.run(commandName, args)) {
        hasRun = true
        break
      }
    }

    if (!hasRun) {
      error('不支持该命令，请通过-h查看')
      process.exit(-1)
    }
  }
}
