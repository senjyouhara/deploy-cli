import { ConfigOptions, PathInfoType, ScriptType } from '@/types/type'
// @ts-ignore
import CMD from 'node-cmd'
import AbstractDeployComponentService from '../abstractDeployComponentService'
import { error, info, loading, succeed, underline } from '@/util/oraUtil'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { deployHooksUtils } from '@/config/config'
import { join, log, scanPathList } from '@/util'
import { deleteFolder } from '@/util/ioUtil'
export type runScriptType = {
  path: string
  command: string
  fileName(name: string, command: string): string
  serverScript: string[]
  postScript: string[]
}
export type waitUploadStaticFileType = { path: string; pathName: string; fileName: string }
export type buildType = {
  filePath: string
  dirPath: string
  fileName: string
  serverScript: string[]
  waitUploadStaticFileList: waitUploadStaticFileType[]
}
export default class BuildService extends AbstractDeployComponentService {
  config: ConfigOptions | null = null
  packages: PathInfoType[] = []
  runScripts: runScriptType[] = []
  waitBuildScripts: ScriptType[] = []
  results: buildType[] = []
  constructor() {
    super()
  }

  buildScriptTransform(waitBuildScripts: ScriptType[]) {
    let prevItem = null
    let list: runScriptType[] = []
    let tempList: runScriptType[] = []
    const defaultFileName = (name: string, command: string) => name
    let packages = this.packages
    if (packages.length > 1) {
      packages = packages.filter(v => v.name != 'root')
    }

    log(`packages: `, packages)

    for (let i in waitBuildScripts) {
      const item = waitBuildScripts[i]
      const postScript = item.postScript ? (Array.isArray(item.postScript) ? item.postScript : [item.postScript]) : []
      const serverScript = item.serverScript
        ? Array.isArray(item.serverScript)
          ? item.serverScript
          : [item.serverScript]
        : []
      if (!(item.other || item.path || item.pattern)) {
        continue
      }
      if (!item.command) {
        continue
      }

      const filter = packages.filter(v => {
        return (item.path && v.path.endsWith(item.path!)) || (item.pattern && item.pattern.test(v.path))
      })
      let waitPushData: runScriptType[] = []
      if (item.path) {
        if (item.path == '*') {
          waitPushData = packages.map(v => ({
            path: join(v.path),
            command: item.command,
            fileName: item.fileName || defaultFileName,
            postScript,
            serverScript,
          }))
        } else {
          if (filter.length) {
            waitPushData.push(
              ...filter.map(v => ({
                path: join(v.path),
                command: item.command,
                fileName: item.fileName || defaultFileName,
                postScript,
                serverScript,
              })),
            )
          }
        }
      } else if (item.pattern) {
        if (filter.length) {
          waitPushData.push(
            ...filter.map(v => ({
              path: join(v.path),
              command: item.command,
              fileName: item.fileName || defaultFileName,
              postScript,
              serverScript,
            })),
          )
        }
      } else if (item.other) {
        const otherFilter = packages.filter(v => !tempList.find(s => s.path == v.path))
        waitPushData.push(
          ...otherFilter.map(v => ({
            path: join(v.path),
            command: item.command,
            fileName: item.fileName || defaultFileName,
            postScript,
            serverScript,
          })),
        )
      }

      if (item.exclude && waitPushData.length) {
        let exclude: any[] = Array.isArray(item.exclude) ? item.exclude : [item.exclude]
        exclude = exclude.map(v => {
          if (v instanceof RegExp) {
            return { pattern: v }
          } else {
            return { path: v }
          }
        })
        const excludeFilter = waitPushData.filter(
          v => !exclude.find(s => (v.path && v.path.endsWith(s.path!)) || (v.path && s.pattern?.test(v.path))),
        )
        log(excludeFilter, 'excludeFilter')
        if (excludeFilter.length) {
          waitPushData = excludeFilter
        }
      }

      list.push(...waitPushData)
      if (item.other) {
        tempList = []
      } else {
        tempList.push(...waitPushData)
      }

      prevItem = item
    }

    this.runScripts = list

    log(`checkScriptList: `, list)
  }

  async runScript(): Promise<any> {
    if (!this.runScripts.length) {
      return Promise.resolve([])
    }

    return new Promise(async (resolve, reject) => {
      const results = []
      for (let v of this.runScripts) {
        deployHooksUtils.run('preBuild', this.config, v)
        process.chdir(v.path)
        const { err, data, stderr } = CMD.runSync(v.command)

        if (err) {
          error('打包命令执行失败')
          console.log(`err:`, err)
          process.exit(-1)
        }

        console.log(data)

        const fileName = v.fileName(v.path.slice(v.path.lastIndexOf('/') + 1), v.command)

        if (fs.existsSync(`${v.path}/${fileName}.zip`)) {
          info(`该文件已存在 ${v.path}/${fileName}.zip，将进行删除操作`)
          fs.unlinkSync(`${v.path}/${fileName}.zip`)
        }

        if (fs.existsSync(v.path + '/' + this.config?.outputPath)) {
          deleteFolder(v.path + '/' + fileName)
          fs.renameSync(v.path + '/' + this.config?.outputPath, v.path + '/' + fileName)
        }

        succeed('开始进行打包zip操作')

        let isZipSuccess = false

        const output = fs
          .createWriteStream(`${v.path}/${fileName}.zip`)
          .on('error', e => {
            if (e) {
              error(`打包zip出错: ${e}`)
            }
          })
          .on('finish', () => {
            isZipSuccess = true
            succeed(`${underline(`${fileName}.zip`)} 打包成功`)
          })
        const archive = archiver('zip')
        archive.pipe(output)

        let waitUploadStaticFileList: waitUploadStaticFileType[] = []
        // 如果为cos项目 则不对内部静态资源打包 只打包index.html和图标
        if (this.config?.secretId || this.config?.getTempAuthInfo) {
          if (fs.existsSync(join(v.path, fileName, 'index.html'))) {
            archive.file(join(v.path, fileName, 'index.html'), { name: 'index.html' })
          } else {
            error('index.html文件不存在')
            process.exit(1)
          }
          if (fs.existsSync(join(v.path, fileName, 'favicon.ico'))) {
            archive.file(join(v.path, fileName, 'favicon.ico'), { name: 'favicon.ico' })
          }
          waitUploadStaticFileList = scanPathList(join(v.path, fileName))
        } else {
          archive.directory(join(v.path, fileName), false)
        }
        await archive.finalize()

        if (this.config?.secretId || this.config?.getTempAuthInfo) {
          waitUploadStaticFileList = waitUploadStaticFileList.filter(v => {
            return !['index.html', 'favicon.ico'].includes(v.pathName)
          })
        }
        if (v.postScript.length || this.config!.postScript) {
          const postScript = Array.isArray(this.config!.postScript)
            ? this.config!.postScript
            : [this.config!.postScript]
          process.chdir(v.path)
          ;(v.postScript.length ? v.postScript : postScript).map(s => {
            succeed(`开始执行后置脚本命令${s}`)
            const { data } = CMD.runSync(s)
            succeed(`后置脚本输出 ${data}`)
          })
        }

        let serverScript: string[] = []
        if (v.serverScript.length) {
          serverScript = v.serverScript
        } else if (this.config!.serverScript) {
          serverScript = Array.isArray(this.config!.serverScript)
            ? this.config!.serverScript
            : [this.config!.serverScript]
        }

        const result = {
          dirPath: v.path,
          fileName,
          filePath: `${v.path}/${fileName}.zip`,
          waitUploadStaticFileList: waitUploadStaticFileList,
          serverScript,
        }

        deployHooksUtils.run('postBuild', this.config!, v, result)

        await new Promise(res => {
          let timer = setInterval(() => {
            if (isZipSuccess) {
              clearInterval(timer)
              res(1)
            }
          }, 50)
        })

        results.push(result)
      }

      this.results = results
      resolve(results)
    })
  }

  checkConfig(config: ConfigOptions): { flag: boolean; data: any } {
    if (!config.script || !config?.script.length) {
      error('script参数未指定，请检查')
      process.exit(1)
    }

    if (!config.outputPath) {
      error('未指定outputPath参数，请确认')
      process.exit(1)
    }

    this.config = config
    const { script } = config
    if (Array.isArray(script)) {
      this.waitBuildScripts = script
    } else {
      this.waitBuildScripts = [
        {
          path: '*',
          command: script,
          postScript: [],
          serverScript: [],
        },
      ]
    }

    return { flag: true, data: null }
  }

  async exec(): Promise<any[]> {
    if (!this.waitBuildScripts.length) {
      return Promise.resolve([])
    }

    this.buildScriptTransform(this.waitBuildScripts)
    return this.runScript()
  }

  init(packages: any): any {
    this.packages = packages
  }

  async finish() {
    if (this.results.length) {
      for (let result of this.results) {
        if (fs.existsSync(result.dirPath + '/' + result.fileName)) {
          deleteFolder(result.dirPath + '/' + result.fileName)
        }
      }
    }
  }
}
