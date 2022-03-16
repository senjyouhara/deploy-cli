import Command from './command'
import minimist from 'minimist'
import { getVersion, log } from './util'
import { onProcessEvent } from './process'
import map from './util/global'
export default class EntryService {
  command: Command = new Command()
  argv: any[] = []

  constructor(argv: any[]) {
    this.argv = argv || []
  }

  run() {
    onProcessEvent.onProcess()
    this.parseArgs()
  }

  parseArgs() {
    const args: any = minimist(this.argv.slice(2), {
      alias: {
        version: ['v'],
        help: ['h'],
      },
      boolean: ['version', 'help'],
    })
    const command: string = args._[0]
    map.set('command', command)
    map.set('args', args)
    map.set('debug', args.debug)
    log(`command`, command)
    log(`args`, args)
    if (command) {
      this.command.execCommand(command, args)
    } else {
      if (args.v) {
        console.log(`Version: ${getVersion()}`)
      } else {
        const loggerTips = [
          'Usage: kamisiro-deploy-cli [Options] Or kamisiro-deploy-cli <command> [options]',
          'Options:',
          '  -v, --version  查询版本号',
          '  -h, --help     显示帮助',
          '  --debug        输出详细日志',
          'Commands:',
        ]
        loggerTips.forEach(item => {
          console.log('info', item)
        })
        const commandDesc = this.command.getCommandDesc()
        commandDesc.forEach(v => {
          console.log('info', `  ${v.command}      ${v.desc}`)
        })
      }
    }
  }
}
