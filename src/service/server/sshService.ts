import AbstractDeployComponentService from '../abstractDeployComponentService'
import { ConfigOptions, ServerOptionsType, SshType } from '../../types/type'
import { NodeSSH } from 'node-ssh'
import { error, info, loading, succeed, underline } from '../../util/oraUtil'
import * as fs from 'fs'
import { buildType } from '../build/buildService'
import { logger } from '../../logger'
import ora from 'ora'
import path from 'path'
import { notAllowedShellScript } from '../../util'
import { deployHooks, deployHooksUtils } from '../../config/config'
import dayjs from 'dayjs'

interface configError {
  errorTest: boolean
  errorTips: string
}

export default class SshService extends AbstractDeployComponentService {
  config: ConfigOptions | null = null
  ssh: NodeSSH
  constructor() {
    super()
    this.ssh = new NodeSSH()
  }
  checkConfig(config: ConfigOptions): { flag: boolean; data: any } {
    if (config) {
      const errorConditions: configError[] = [
        {
          errorTest: !config.host,
          errorTips: '未指定host地址',
        },
        {
          errorTest: !config.port,
          errorTips: '未指定port',
        },
        {
          errorTest: !config.username,
          errorTips: '未指定username',
        },
        {
          errorTest: !config.serverPath,
          errorTips: '未指定serverPath',
        },
        {
          errorTest: !config.privateKey && !config.password,
          errorTips: '未指定password或privateKey',
        },
      ]
      const configErrInfo: configError | undefined = errorConditions.find(item => item.errorTest)
      if (configErrInfo) {
        error(configErrInfo.errorTips)
        process.exit(1)
      }

      this.config = config

      return { data: undefined, flag: true }
    }

    return { data: undefined, flag: false }
  }

  // 删除远程文件
  async removeRemoteFile(path: string) {
    try {
      // info(`删除远程文件 ${underline(path)}`)
      await this.ssh.execCommand(`rm -rf ${path}`)
    } catch (e) {
      error(e as string)
      process.exit(1)
    }
  }

  // 删除本地打包文件
  async removeZipFile(path: string) {
    if (this.config!.isRemoveLocalFile) {
      const localPath = path
      info(`删除本地打包文件 ${underline(localPath)}`)
      fs.unlinkSync(localPath)
      succeed('删除本地打包文件成功')
    }
  }

  // 上传本地文件
  async uploadLocalFile(localFilePath: string, remoteFilePath: string) {
    try {
      const localFileName = localFilePath
      const remoteFileName = remoteFilePath

      info(`上传打包zip至目录 ${underline(remoteFileName)}`)

      const spinner = ora('正在上传中\n').start()

      await this.ssh
        .putFile(localFileName, remoteFileName, null, {
          concurrency: 1,
        })
        .then(null, err => {
          logger.print('error', `error: ${JSON.stringify(err)}`)
        })

      spinner.stop()
      succeed('上传成功')
    } catch (e) {
      error(`上传失败: ${e}`)
      process.exit(1)
    }
  }

  // 解压远程文件
  async unzipRemoteFile(fileName: string) {
    // @ts-ignore
    const { serverPath } = this.config
    const remoteFileName = `${serverPath}/${fileName}`

    info(`解压远程文件 ${underline(remoteFileName)}`)

    await this.ssh
      .execCommand(
        `unzip -o ${remoteFileName} -d ${serverPath}/${fileName.slice(
          0,
          fileName.lastIndexOf('.zip'),
        )} && rm -rf ${remoteFileName}`,
      )
      // @ts-ignore
      .then(({ stderr }) => {
        if (stderr) {
          error('STDERR: ' + stderr)
          return Promise.reject(stderr)
        }
        succeed(`解压 ${fileName} 成功 `)
      })
      .catch(err => {
        if (err.includes('unzip: command not found')) {
          info('yum 自动安装 unzip...')
          this.ssh.execCommand('yum install -y unzip zip').then(({ stderr }) => {
            if (!stderr) {
              this.unzipRemoteFile(fileName)
            }
          })
        } else {
          process.exit(1)
        }
      })
  }

  async backRemoteFile(path: string) {
    if (this.config?.isBakFile) {
      let backFileName
      if (this.config?.bakFileName) {
        backFileName =
          typeof this.config?.bakFileName == 'string'
            ? this.config?.bakFileName
            : this.config?.bakFileName(path.slice(path.lastIndexOf('/') + 1))
      } else {
        backFileName = path.slice(path.lastIndexOf('/') + 1) + '-bak-' + dayjs().format('YYYYMMDDHHmmss')
      }

      await this.ssh.execCommand(
        `[ -d ${path} ] && cp -r ${path} ${path.slice(0, path.lastIndexOf('/') + 1) + backFileName} || echo no`,
      )
    }
  }

  async runServiceScript(dir: string, command: string[]) {
    succeed(`进入目录 ${dir}`)
    await this.ssh.execCommand(`cd ${dir}`)
    for (let i of command) {
      succeed(`开始执行脚本 ${i}`)
      const find = notAllowedShellScript.find(v => v.test(i))
      if (find) {
        error(`因安全策略限制，无法执行该命令 ${i} , 请修改`)
        continue
      }
      await this.ssh.execCommand(`${i}`).then(({ stdout }) => {
        info(`执行脚本输出: ${JSON.stringify(stdout)}`)
      })
    }
  }

  async checkServerPathExist(path: string) {
    await this.ssh.execCommand(`[ -d ${path} ] && echo yes || mkdir -p ${path}`)
  }

  async exec(buildList: buildType[]): Promise<any> {
    if (this.config) {
      try {
        deployHooksUtils.run('preConnectServer', this.config)

        await this.ssh.connect({ ...this.config })

        deployHooksUtils.run('connectServerSuccess', this.config!)

        for (let i of buildList) {
          deployHooksUtils.run('preDeploy', this.config!, i)

          const commands = i.serverScript
          // 如果指定的服务器目录不存在将进行创建
          await this.checkServerPathExist(this.config.serverPath)
          // 上传文件
          await this.uploadLocalFile(i.filePath, this.config.serverPath + '/' + i.fileName + '.zip')
          // 删除本地文件
          await this.removeZipFile(i.filePath)
          // 备份远程文件
          await this.backRemoteFile(this.config.serverPath + '/' + i.fileName)
          // 是否删除远程文件后再解压
          await this.removeRemoteFile(this.config.serverPath + '/' + i.fileName)
          // 解压文件
          await this.unzipRemoteFile(i.fileName + '.zip')
          // 执行后置脚本
          await this.runServiceScript(i.fileName, commands)

          deployHooksUtils.run('postDeploy', this.config!, i, this.config.serverPath + '/' + i.fileName)
        }

        //关闭ssh
        this.ssh.dispose()
        deployHooksUtils.run('closeServer', this.config!)
      } catch (e: any) {
        error(e)
        process.exit(1)
      }
    }
  }

  init(data: buildType[]): void {}
}
