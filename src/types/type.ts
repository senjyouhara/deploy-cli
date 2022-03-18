export interface SshType {
  // 服务器地址
  host?: string
  // 服务器端口号
  port?: number
  // 用户名
  username?: string
  // 密码(和私钥二选一)
  password?: string
  // 本地私钥路径(和密码二选一)
  privateKey?: string
  // 本地私钥密码(如果私钥没设密码留空即可)
  passphrase?: string
}

export interface CosType {
  cosType?: 'tencent' | 'aliyun'
  // cosSecretId(如果填写该项目则为cdn项目)
  secretId?: string
  // cosSecretKey(如果填写该项目则为cdn项目)
  secretKey?: string
  // cos桶名称
  bucket?: string
  // cos地域
  region?: string
  // cos上传目录
  cosUploadPath?: string
  // 是否上传到cos之前先清除原本目录
  isRemoveCosFile?: boolean
  // 获取临时密钥函数
  getTempAuthInfo?: () => CosTempAuthType
}

export interface ServerOptionsType {
  // 服务器部署路径
  serverPath?: string
  // 是否备份服务器原文件
  isBakFile?: boolean
  // 备份的文件名
  bakFileName?: string | ((name: string) => string)
  // 是否部署前先删除服务器原文件
  isRemoveServerFile?: boolean
  // 在文件部署完成后执行一些服务器脚本
  serverScript?: string | string[]
}

export interface CosTempAuthType {
  tmpSecretId: string
  tmpSecretKey: string
  expiredTime: number
  startTime: number
  token: string
  region: string
  bucket: string
}

export type PathInfoType = { name: string; path: string }

export type ScriptType = {
  path?: string
  postScript?: string | string[]
  serverScript?: string | string[]
  command: string
  pattern?: RegExp
  other?: boolean
  fileName?(name: string): string
  exclude?: { path?: string; pattern?: RegExp }[]
}

export interface DeployHooksType {}

export interface ConfigOptions extends SshType, CosType, ServerOptionsType {
  // 项目名称
  projectName?: string
  // 环境名称
  platformName?: string
  /**
   * 打包命令
   * 为了针对不同项目执行一些定制化打包操作，现制定了打包规则与逻辑
   * 如果为普通项目  则直接执行npm run build即可
   * 如果为lerna或pnmpm项目 会有复数项目存在，这种情况下单执行一个命令可能无法满足各种需求
   * 因此写了如下规则来应对需要
   * 对于lerna或pnpm项目 则把script参数改为数组形式
   * [
   *  {
   *    path: 'canghai_project' || 'packages/canghai_project',
   *    command: 'npm run build'
   *  },{
   *    pattern: /canghai_[a-zA-Z]+$/ || /packages\/canghai_[a-zA-Z]+$/,
   *    command: 'npm run build:ym',
   *    exclude: ['canghai_project']
   *  },{
   *    pattern: /canghai_[a-zA-Z]+123$/ || /packages\/canghai_[a-zA-Z]+123$/,
   *    command: 'npm run build:ym',
   *    exclude: [/^canghai_[a-zA-Z]+$/]
   *  },{
   *    other: true,
   *    command: 'npm run build:ys',
   *  },
   *  {
   *   path: '*',
   *   command: 'npm run build'
   * }
   * ]
   *
   * 这为包含所有场景的情况
   * path与pattern为互斥项 两者只能二选一 如果同时存在将抛出错误
   * pattern和path 与 other也为互斥项 两者只能二选一 如果同时存在将抛出错误
   * path值为2种形式  一种是直接写死的项目文件名  这种情况会精确匹配到该文件路径
   * 另一种形式是写为 * 该情况下会对lerna.json或pnpm里内定义的包路径下的所有项目执行相同命令
   *  pattern 为正则匹配，可以通过正则规则匹配符合条件的文件名 执行对应脚本
   *  other 值只能为true 否则不执行对应脚本 该参数逻辑为对前面表达式所有未命中的项执行该操作  可通过exclude再进行排除
   *
   *  [{
   *    path: 'canghai_project',
   *    command: 'npm run build'
   *  },{
   *    other: true,
   *    command: 'npm run build:ys',
   *  },{
   *    pattern: /^canghai_[a-zA-Z]+123$/,
   *    command: 'npm run build:ym',
   *  }{
   *    other: true,
   *    command: 'npm run build:ys',
   *  },]
   * other值还有个作用  可以像这种方式多次执行 每执行完一个other选项后会清空文件的命中列表，方便多次执行的场景
   * exclude 为排除项 为数组形式 值为2种形式 一种是直接字符串形式  一种是正则表达式 如果exclude的值和当前的pattern或path相同也会抛出错误
   * fileName(name: string, command: string) 该命令为可以给予打包后的文件夹重命名，为了避免一个项目多次打包的场景存在 需要对打包后的文件夹重命名
   * postScript 后置脚本  string | string[] 打包执行完成后执行一些操作,如果和 下方的postScript同时存在 则script的postScript优先级更高
   * serverScript 服务器执行脚本  string | string[] 服务器部署完成后执行一些操作,如果和 下方的serverScript同时存在 则script的serverScript优先级更高
   */
  script?: string | ScriptType[]
  // 是否调用打包命令前执行npm i 一般用作于ci环境
  // 如果为'npm' | 'yarn' | 'pnpm'  则调用对应的包管理器进行安装
  // 如果为false 则不进行安装  如果为true  则搜索lock文件 通过lock文件对应的包管理器进行安装  否则使用npm进行安装
  install?: boolean | 'npm' | 'yarn' | 'pnpm'
  // 打包执行完成后后置命令 用于在打包完成后执行一些后置处理什么的
  postScript?: string | string[]
  // 本地打包生成目录
  outputPath?: string
}

export interface DeployCommandType extends ConfigOptions {
  mode: string
}

export interface InitCommandType {
  d: boolean
}
