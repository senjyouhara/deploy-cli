import path from 'path'
import fs from 'fs'
import { ConfigOptions, DeployCommandType, ScriptType, PathInfoType, CosType } from '../types/type'
import { error, info } from '../util/oraUtil'
import { DEFAULT_FILE_NAME, log, resolve } from '../util'
import { deployHooksUtils } from '../config/config'
import InstallServiceImpl from './install/installServiceImpl'
import BuildService from './build/buildService'
import AbstractDeployComponentService from './abstractDeployComponentService'
import ConfigParseService from './configParse/configParseService'
import CosServiceImpl from './cos/cosServiceImpl'
import SshService from './server/sshService'
import { onProcessEvent } from '../process'
import { readLocalFile } from '../util/ioUtil'

export default class DeployService {
  configPaths: string[] = []
  configFileNames: string[] = []
  configFile: ConfigOptions | null = null
  configBranch: string[] = []
  service: AbstractDeployComponentService
  commandConfigs: DeployCommandType | null = null

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
    let fileNames = obj.mode
      ? [
          `${obj.mode}.${DEFAULT_FILE_NAME}.ts`,
          `${obj.mode}.${DEFAULT_FILE_NAME}.js`,
          `${DEFAULT_FILE_NAME}.ts`,
          `${DEFAULT_FILE_NAME}.js`,
        ]
      : [`${DEFAULT_FILE_NAME}.ts`, `${DEFAULT_FILE_NAME}.js`]
    const filePaths = fileNames.map(v => resolve(v)).filter(v => fs.existsSync(v))
    fileNames = fileNames.filter(v => fs.existsSync(resolve(v)))

    const isModeFile = filePaths.some(item => item.startsWith(`${obj.mode}.${DEFAULT_FILE_NAME}`))
    const isFile = filePaths.some(item => item.startsWith(`${DEFAULT_FILE_NAME}`))

    if (obj.mode && !isModeFile) {
      error(`找不到${obj.mode + '.' + DEFAULT_FILE_NAME}文件，请检查！`)
      process.exit(-1)
    }
    if (!obj.mode && !isFile) {
      error(`找不到${DEFAULT_FILE_NAME}文件，请检查！`)
      process.exit(-1)
    }
    if (filePaths.length == 0) {
      error(`找不到${obj.mode ? obj.mode + '.' + DEFAULT_FILE_NAME : DEFAULT_FILE_NAME}文件，请检查！`)
      process.exit(-1)
    }
    this.configPaths = filePaths
    this.configFileNames = fileNames
    log(`configPaths: `, this.configPaths)
    log(`configFileNames: `, this.configFileNames)
  }

  readConfigFile() {
    for (let i in this.configPaths) {
      const fileName = this.configFileNames[i]
      const filePath = this.configPaths[i]
      try {
        log(`filePath: `, filePath)
        log(`fileName: `, fileName)
        const localFile: any = readLocalFile(filePath)
        log(`localFile: `, localFile)
        // eslint-disable-next-line no-eval
        this.configFile = Object.assign({}, this.configFile, localFile.default)

        if (this.commandConfigs) {
          for (let commandConfigsKey in this.commandConfigs) {
            if (this.configFile![commandConfigsKey]) {
              this.configFile![commandConfigsKey] = this.commandConfigs[commandConfigsKey]
            }
          }
        }
      } catch (e) {
        console.log(`error: `, e)
        error(`${fileName}文件读取失败, 请检查！`)
        process.exit(1)
      }
    }
  }

  async run(obj: DeployCommandType) {
    this.commandConfigs = obj
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
