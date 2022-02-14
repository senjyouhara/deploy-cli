import Command from '@/command'
import minimist from 'minimist'
import { getVersion } from '@/util'
import { onProcessEvent } from '@/process'
import { logger } from '@/logger'

export default class EntryService {
  command: Command = new Command()
  argv: string[] = []

  constructor(argv: string[]) {
    this.argv = argv || []
  }

  run() {
    onProcessEvent.onProcess()
    this.parseArgs()
  }

  parseArgs() {
    const args = minimist(this.argv.slice(2), {
      alias: {
        version: ['v'],
        help: ['h'],
      },
      boolean: ['version', 'help'],
    })
    const command: string = args._[0]
    logger.info(`command: ${command}`)
    logger.info(`args: ${JSON.stringify(args)}`)
    if (command) {
      this.command.execCommand(command, args)
    } else {
      if (args.v) {
        // @ts-ignore
        logger.print('info', `Version: ${getVersion()}`)
      } else {
        const loggerTips = [
          'Usage: senjyouhara-deploy-cli [Options] Or senjyouhara-deploy-cli <command> [options]',
          'Options:',
          '  -v, --version  查询版本号',
          '  -h, --help     显示帮助',
          'Commands:',
        ]
        loggerTips.forEach(item => {
          // @ts-ignore
          logger.print('info', item)
        })
        const commandDesc = this.command.getCommandDesc()
        commandDesc.forEach(v => {
          // @ts-ignore
          logger.print('info', `  ${v.command}      ${v.desc}`)
        })
      }
    }
  }
}
