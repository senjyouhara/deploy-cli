import InstallService from './installService'
// @ts-ignore
import CMD from 'node-cmd'
import * as fs from 'fs'
import { succeed } from '../../util/oraUtil'
import {log} from "../../util";
export default abstract class AbstractInstallServiceImpl implements InstallService {
  protected type = ''
  protected command = ''
  protected installCommand = ''
  protected lockFileName = ''
  protected next: AbstractInstallServiceImpl | undefined

  setNext(next: AbstractInstallServiceImpl) {
    this.next = next
  }

  exec(): any {
    succeed(`执行安装命令${this.installCommand}`)
    return CMD.runSync(this.installCommand).err
  }

  getType(): string {
    return this.type
  }

  isLockFile(): boolean {
    var readdirSync = fs.readdirSync(process.cwd())
    const find = readdirSync.find(v => v == this.lockFileName)
    return !!find
  }

  isSupport(): boolean {
    const { err, data, stderr } = CMD.runSync(this.command + ' -v')
    err && log(`isSupportError: `, err)
    return !err
  }

  getNext(): InstallService | undefined {
    return this.next
  }
}
