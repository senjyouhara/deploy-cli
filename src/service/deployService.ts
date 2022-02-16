import path from 'path'
import fs from 'fs'
import { ConfigOptions, DeployCommandType, ScriptType, PathInfoType, CosType } from '../types/type'
import { error, info } from '../util/oraUtil'
import { DEFAULT_FILE_NAME, resolve } from '../util'
import { deployHooksUtils } from '../config/config'
import InstallServiceImpl from './install/installServiceImpl'
import BuildService from './build/buildService'
import AbstractDeployComponentService from './abstractDeployComponentService'
import ConfigParseService from './configParse/configParseService'
import CosServiceImpl from './cos/cosServiceImpl'
import SshService from './server/sshService'
import { onProcessEvent } from '../process'
import { logger } from '../logger'

export default class DeployService {
  packages: PathInfoType[] = []
  configPaths: string[] = []
  configFiles: string[] = []
  configFile: ConfigOptions | null = null
  configBranch: string[] = []
  service: AbstractDeployComponentService

  constructor() {
    let configParseService = new ConfigParseService()
    let installServiceImpl = new InstallServiceImpl()
    let buildService = new BuildService()
    let cosService = new CosServiceImpl()
    let sshService = new SshService()

    configParseService.setChildren(installServiceImpl)
    configParseService.setNextService(buildService)
    buildService.setChildren(cosService)
    buildService.setNextService(sshService)
    this.service = configParseService
  }

  init(obj: DeployCommandType) {
    this.configPaths = [resolve(DEFAULT_FILE_NAME)]
    this.configFiles = [DEFAULT_FILE_NAME]
    if (obj.mode) {
      this.configPaths.push(resolve(obj.mode + '.' + DEFAULT_FILE_NAME))
      this.configFiles.push(obj.mode + '.' + DEFAULT_FILE_NAME)
    }

    this.configPaths.forEach((v, i) => {
      if (!fs.existsSync(v)) {
        error(`找不到${this.configFiles[i]}文件，请检查`)
        process.exit(-1)
      }
    })

    logger.info(`configPaths: ${JSON.stringify(this.configPaths)}`)
  }

  readConfigFile() {
    for (let i in this.configPaths) {
      const fileName = this.configFiles[i]
      const filePath = this.configPaths[i]
      try {
        logger.info(`filePath: ${filePath}`)
        logger.info(`fileName: ${fileName}`)
        // eslint-disable-next-line no-eval
        const localFile = eval(`require('${filePath}')`)
        logger.info(`localFile: ${JSON.stringify(localFile)}`)
        // eslint-disable-next-line no-eval
        this.configFile = Object.assign({}, this.configFile, localFile)
      } catch (e) {
        logger.print('error', `error: ${e}`)
        error(`${fileName}文件读取失败, 请检查！`)
        process.exit(1)
      }
    }
  }

  async run(obj: DeployCommandType) {
    onProcessEvent.onProcess()
    this.init(obj)
    this.readConfigFile()

    deployHooksUtils.run('start', this.configFile!)

    let service = this.service
    let preData
    let execData
    while (service) {
      const init = service.init(preData)
      if (init instanceof Promise) {
        await init
      }
      const result = service.checkConfig(this.configFile)
      if (result.flag) {
        let data = service.exec(execData)
        if (data instanceof Promise) {
          data = await data
        }

        service.close()
        preData = result.data
        execData = data

        if (service.getChildren().length) {
          for (let i of service.getChildren()) {
            const init = i.init(preData)
            if (init instanceof Promise) {
              await init
            }
            const result = i.checkConfig(this.configFile)
            if (result.flag) {
              const tmp = i.exec(execData)
              if (tmp instanceof Promise) {
                await tmp
              }
              i.close()
            }
          }
        }
        await service.finish()
      }

      service = service.getNextService()
    }

    deployHooksUtils.run('finish', this.configFile!)
    process.exit()
  }
}
