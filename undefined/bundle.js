'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fs = require('fs');
var os = require('os');
var path = require('path');
var ora = require('ora');
var chalk = require('chalk');
var inquirer = require('inquirer');
var babel = require('@babel/core');
var tslib = require('tslib');
var CMD = require('node-cmd');
var archiver = require('archiver');
var yaml = require('js-yaml');
var Cos = require('cos-nodejs-sdk-v5');
var Cos$1 = require('ali-oss');
var nodeSsh = require('node-ssh');
var dayjs = require('dayjs');
var minimist = require('minimist');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n["default"] = e;
    return Object.freeze(n);
}

var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var fs__namespace = /*#__PURE__*/_interopNamespace(fs);
var os__default = /*#__PURE__*/_interopDefaultLegacy(os);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var ora__default = /*#__PURE__*/_interopDefaultLegacy(ora);
var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var inquirer__default = /*#__PURE__*/_interopDefaultLegacy(inquirer);
var babel__namespace = /*#__PURE__*/_interopNamespace(babel);
var CMD__default = /*#__PURE__*/_interopDefaultLegacy(CMD);
var archiver__default = /*#__PURE__*/_interopDefaultLegacy(archiver);
var yaml__default = /*#__PURE__*/_interopDefaultLegacy(yaml);
var Cos__default = /*#__PURE__*/_interopDefaultLegacy(Cos);
var Cos__default$1 = /*#__PURE__*/_interopDefaultLegacy(Cos$1);
var dayjs__default = /*#__PURE__*/_interopDefaultLegacy(dayjs);
var minimist__default = /*#__PURE__*/_interopDefaultLegacy(minimist);

var map = new Map();

const getVersion = () => {
  return 'V' + "1.0.8";
};
const DEFAULT_FILE_NAME = 'deploy.config';
const getFileName = platformName => (platformName && platformName + '.') + DEFAULT_FILE_NAME;
const join = (...args) => {
  return path__default["default"].join(...args).replace(/\\+/g, '/');
};
const resolve = (...args) => {
  return path__default["default"].resolve(...args).replace(/\\+/g, '/');
};
const notAllowedShellScript = [/rm\s+-rf.+/, /.+\.sh/];
const scanPathList = basePath => {
  function _getScanPath(basePath, fullPath) {
    if (!fullPath || !fs__default["default"].existsSync(fullPath)) {
      return [];
    }

    let list = [];
    var stat = fs__default["default"].statSync(fullPath);

    if (stat.isDirectory()) {
      const fileList = fs__default["default"].readdirSync(fullPath, 'utf-8');
      fileList.forEach(v => {
        list.push(..._getScanPath(basePath, join(fullPath, v)));
      });
    } else {
      list.push({
        pathName: fullPath.replace(basePath + '/', '').replace(/\\+/g, '/'),
        path: fullPath.replace(/\\+/g, '/'),
        fileName: fullPath.slice(fullPath.lastIndexOf('/') + 1).replace(/\\+/g, '/')
      });
    }

    return list;
  }

  return _getScanPath(basePath, basePath);
};
function log(...args) {
  map.get('debug') && console.log(...args);
}

const succeed = (...message) => {
  ora__default["default"]().succeed(chalk__default["default"].greenBright.bold(message));
};
const info = (...message) => {
  ora__default["default"]().info(chalk__default["default"].blueBright.bold(message));
};
const error = (...message) => {
  ora__default["default"]().fail(chalk__default["default"].redBright.bold(message));
};
const loading = (...message) => {
  return ora__default["default"](chalk__default["default"].cyan(message)).start();
};
const underline = (...message) => {
  return chalk__default["default"].underline.blueBright.bold(message);
};

function getUserPackage() {
  return join(process.cwd(), 'package.json');
}

const platformConfig = [{
  type: 'input',
  name: 'projectName',
  message: '项目名称',
  default: fs__default["default"].existsSync(getUserPackage()) ? JSON.parse(fs__default["default"].readFileSync(getUserPackage(), 'utf-8')).name : ''
}, {
  type: 'input',
  name: 'platformName',
  message: '环境名称',

  validate(input) {
    const platformName = input.trim();
    var done = this.async();

    if (fs__default["default"].existsSync(`${join(process.cwd(), getFileName(platformName), '.ts')}`) || fs__default["default"].existsSync(`${join(process.cwd(), getFileName(platformName), '.js')}`)) {
      done('该环境的配置文件已存在，请确认');
      setTimeout(() => {
        process.exit(-1);
      }, 200);
      return;
    }

    done(null, true);
  }

}, {
  type: 'input',
  name: 'script',
  message: '打包命令',
  default: 'npm run build'
}, {
  type: 'confirm',
  name: 'isInstall',
  message: '是否调用打包命令前执行npm i',
  default: true
}, {
  type: 'input',
  name: 'postScript',
  message: '打包执行完成后后置命令',
  when: () => false
}, {
  type: 'input',
  name: 'host',
  message: '服务器地址',

  validate(input) {
    if (/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.test(input)) {
      return true;
    }

    return 'ip格式不正确';
  }

}, {
  type: 'number',
  name: 'port',
  message: '服务器端口号',
  default: 22,

  validate(input) {
    const n = Number(input);

    if (isNaN(n)) {
      return '端口号不正确';
    }

    if (!(n >= 1 && n <= 65535)) {
      return '端口号必须为1-65535这个范围之内';
    }

    return true;
  }

}, {
  type: 'input',
  name: 'username',
  message: '用户名'
}, {
  type: 'password',
  name: 'password',
  message: '密码(和私钥二选一)'
}, {
  type: 'input',
  name: 'privateKey',
  message: '本地私钥路径(和密码二选一)',
  default: join(os__default["default"].homedir(), '.ssh', 'id_rsa')
}, {
  type: 'password',
  name: 'passphrase',
  message: '本地私钥密码(如果私钥没设密码留空即可)'
}, {
  type: 'confirm',
  name: 'isUseTempCosAuth',
  message: '是否使用临时cos秘钥进行cos上传(如果为true则不需要填写secretId和secretKey)',
  default: false
}, {
  type: 'input',
  name: 'secretId',
  message: 'cosSecretId(如果填写该项目则为cdn项目)'
}, {
  type: 'input',
  name: 'secretKey',
  message: 'cosSecretKey(如果填写该项目则为cdn项目)'
}, {
  type: 'input',
  name: 'cosType',
  message: 'cos类型',
  default: 'tencent',
  when: () => false
}, {
  type: 'input',
  name: 'bucket',
  message: 'cos桶名称'
}, {
  type: 'input',
  name: 'region',
  message: 'cos地域'
}, {
  type: 'input',
  name: 'cosUploadPath',
  message: 'cos上传目录'
}, {
  type: 'confirm',
  name: 'isRemoveCosFile',
  message: '是否上传到cos之前先清除原本目录',
  default: false
}, {
  type: 'input',
  name: 'outputPath',
  message: '本地打包生成目录',
  default: 'dist'
}, {
  type: 'input',
  name: 'serverPath',
  message: '服务器部署路径'
}, {
  type: 'confirm',
  name: 'isBakFile',
  message: '是否备份服务器原文件',
  default: false
}, {
  type: 'input',
  name: 'bakFileName',
  message: '备份的文件名(如为空则默认生成)'
}, {
  type: 'confirm',
  name: 'isRemoveServerFile',
  message: '是否部署前先删除服务器原文件',
  default: true
}, {
  type: 'input',
  name: 'serverScript',
  when: () => false,
  message: '执行服务器脚本'
}];
const deployHooks = [{
  start(config) {
    succeed(`项目部署开始 ${config.projectName}`);
  },

  preInstall(config, pack) {
    succeed(`开始 ${pack.path} 目录安装依赖 `);
  },

  postInstall(config, pack, type, success) {
    if (success) {
      succeed(`${pack.path} 目录依赖安装完成`);
    } else {
      error(`${pack.path} 目录依赖安装失败`);
    }
  },

  preBuild(config, runScript) {
    succeed(`在 ${runScript.path} 目录开始执行打包命令`);
  },

  postBuild(config, runScript, result) {
    succeed(`在 ${runScript.path} 目录编译完成生成压缩文件 ${result.filePath}`);
  },

  preCos(config, uploadData) {
    succeed(`${uploadData.fileName}目录文件 开始上传到COS`);
  },

  postCos(config, uploadData) {
    succeed(`${uploadData.fileName}目录文件 上传COS完成`);
  },

  preConnectServer(config) {
    succeed(`开始连接服务器 ${config.host}:${config.port}`);
  },

  connectServerSuccess(config) {
    succeed(`服务器连接成功 ${config.host}:${config.port}`);
  },

  preDeploy(config, buildData) {
    succeed(`开始部署 ${buildData.fileName}.zip 到服务器 `);
  },

  postDeploy(config, buildData, remoteDir) {
    succeed(`部署 ${buildData.fileName}.zip 到服务器完成 部署目录 ${remoteDir}`);
  },

  closeServer(config) {
    succeed(`关闭服务器连接 ${config.host}:${config.port}`);
  },

  finish(config) {
    succeed(`项目部署完成 ${config.projectName}`);
  }

}];
const deployHooksUtils = {
  run(keyName, ...args) {
    const preFilter = deployHooks.filter(v => Object.keys(v).includes(keyName));
    preFilter.forEach(v => v[keyName](...args));
  }

};
const defineConfig = config => config;

/*
from https://github.com/substack/vm-browserify/blob/bfd7c5f59edec856dc7efe0b77a4f6b2fa20f226/index.js

MIT license no Copyright holder mentioned
*/


function Object_keys(obj) {
  if (Object.keys) return Object.keys(obj)
  else {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
  }
}

function forEach(xs, fn) {
  if (xs.forEach) return xs.forEach(fn)
  else
    for (var i = 0; i < xs.length; i++) {
      fn(xs[i], i, xs);
    }
}
var _defineProp;

function defineProp(obj, name, value) {
  if (typeof _defineProp !== 'function') {
    _defineProp = createDefineProp;
  }
  _defineProp(obj, name, value);
}

function createDefineProp() {
  try {
    Object.defineProperty({}, '_', {});
    return function(obj, name, value) {
      Object.defineProperty(obj, name, {
        writable: true,
        enumerable: false,
        configurable: true,
        value: value
      });
    };
  } catch (e) {
    return function(obj, name, value) {
      obj[name] = value;
    };
  }
}

var globals = ['Array', 'Boolean', 'Date', 'Error', 'EvalError', 'Function',
  'Infinity', 'JSON', 'Math', 'NaN', 'Number', 'Object', 'RangeError',
  'ReferenceError', 'RegExp', 'String', 'SyntaxError', 'TypeError', 'URIError',
  'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
  'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'undefined', 'unescape'
];

function Context() {}
Context.prototype = {};

function Script(code) {
  if (!(this instanceof Script)) return new Script(code);
  this.code = code;
}
function otherRunInContext(code, context) {
  var args = Object_keys(global);
  args.push('with (this.__ctx__){return eval(this.__code__)}');
  var fn = Function.apply(null, args);
  return fn.apply({
    __code__: code,
    __ctx__: context
  });
}
Script.prototype.runInContext = function(context) {
  if (!(context instanceof Context)) {
    throw new TypeError('needs a \'context\' argument.');
  }
  if (global.document) {
    var iframe = global.document.createElement('iframe');
    if (!iframe.style) iframe.style = {};
    iframe.style.display = 'none';

    global.document.body.appendChild(iframe);

    var win = iframe.contentWindow;
    var wEval = win.eval,
      wExecScript = win.execScript;

    if (!wEval && wExecScript) {
      // win.eval() magically appears when this is called in IE:
      wExecScript.call(win, 'null');
      wEval = win.eval;
    }

    forEach(Object_keys(context), function(key) {
      win[key] = context[key];
    });
    forEach(globals, function(key) {
      if (context[key]) {
        win[key] = context[key];
      }
    });

    var winKeys = Object_keys(win);

    var res = wEval.call(win, this.code);

    forEach(Object_keys(win), function(key) {
      // Avoid copying circular objects like `top` and `window` by only
      // updating existing context properties or new properties in the `win`
      // that was only introduced after the eval.
      if (key in context || indexOf(winKeys, key) === -1) {
        context[key] = win[key];
      }
    });

    forEach(globals, function(key) {
      if (!(key in context)) {
        defineProp(context, key, win[key]);
      }
    });
    global.document.body.removeChild(iframe);

    return res;
  }
  return otherRunInContext(this.code, context);
};

Script.prototype.runInThisContext = function() {
  var fn = new Function('code', 'return eval(code);');
  return fn.call(global, this.code); // maybe...
};

Script.prototype.runInNewContext = function(context) {
  var ctx = createContext(context);
  var res = this.runInContext(ctx);
  if (context) {
    forEach(Object_keys(ctx), function(key) {
      context[key] = ctx[key];
    });
  }

  return res;
};


function createScript(code) {
  return new Script(code);
}

function createContext(context) {
  if (isContext(context)) {
    return context;
  }
  var copy = new Context();
  if (typeof context === 'object') {
    forEach(Object_keys(context), function(key) {
      copy[key] = context[key];
    });
  }
  return copy;
}
function runInContext(code, contextifiedSandbox, options) {
  var script = new Script(code, options);
  return script.runInContext(contextifiedSandbox, options);
}
function runInThisContext(code, options) {
  var script = new Script(code, options);
  return script.runInThisContext(options);
}
function isContext(context) {
  return context instanceof Context;
}
function runInNewContext(code, sandbox, options) {
  var script = new Script(code, options);
  return script.runInNewContext(sandbox, options);
}
var vm = {
  runInContext: runInContext,
  isContext: isContext,
  createContext: createContext,
  createScript: createScript,
  Script: Script,
  runInThisContext: runInThisContext,
  runInNewContext: runInNewContext
};


/*
from indexOf
@ author tjholowaychuk
@ license MIT
*/
var _indexOf = [].indexOf;

function indexOf(arr, obj){
  if (_indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
}

const saveFile = (path, data) => {
  fs__default["default"].writeFileSync(path, data, {
    encoding: 'utf8'
  });
};
const readLocalFile = path => {
  const options = {
    presets: [['@babel/preset-env', {
      modules: 'cjs',
      targets: {
        esmodules: true
      }
    }], '@babel/preset-typescript']
  };
  const data = babel__namespace.transformFileSync(path, options).code;
  const wrapper = ['(function(exports, require, module, __filename,__dirname){', '})'];
  let fnStr = wrapper[0] + data + wrapper[1];
  log(data, 'code');
  let wrapperFn = vm.runInThisContext(fnStr);
  let value = {};
  wrapperFn.call(value, require, value, __filename, __dirname);
  log(value, 'data');
  return value;
};
function deleteFolder(path) {
  let files = [];

  if (fs__default["default"].existsSync(path)) {
    files = fs__default["default"].readdirSync(path);
    files.forEach(function (file, index) {
      let curPath = path + '/' + file;

      if (fs__default["default"].statSync(curPath).isDirectory()) {
        deleteFolder(curPath);
      } else {
        fs__default["default"].unlinkSync(curPath);
      }
    });
    fs__default["default"].rmdirSync(path);
  }
}

class ConfigProcessService {
  checkConfig(answer) {
    log(`answer: `, answer);
    platformConfig.filter(v => v.default instanceof Boolean).map(v => ({
      name: v.name
    })).forEach(v => {
      if (!answer[v.name]) {
        answer[v.name] = false;
      }
    });
    return Promise.resolve(answer);
  }

  createJsonObjectStr(data) {
    return Promise.resolve(data);
  }

  saveFile(json) {
    const spinner = loading('正在生成配置文件...');
    const requireStr = `import { defineConfig } from '${"@kamisiro/deploy-cli"}'`;
    const exportStr = `${requireStr}\nexport default defineConfig(${JSON.stringify(json, null, 2)})`;
    const filePath = join(process.cwd(), getFileName(json.platformName) + '.ts');
    const fileData = `${exportStr}`;
    saveFile(filePath, fileData);
    spinner.succeed(chalk__default["default"].green('生成完成, 请进行查看...'));
  }

}

class InitCommand {
  constructor() {
    this.configProcessService = new ConfigProcessService();
    this.commandName = 'init';
    this.allowConfigNames = ['d'];
    this.commandDesc = [{
      command: this.commandName,
      desc: '通过命令行创建文件'
    }, {
      command: this.commandName + ' -d',
      desc: '静默创建默认文件'
    }];
  }

  run(commandName, args) {
    if (commandName != this.commandName) {
      return false;
    }

    let obj = {};

    for (let j = 0; j < this.allowConfigNames.length; j++) {
      if (args[this.allowConfigNames[j]] != null) {
        obj[this.allowConfigNames[j]] = args[this.allowConfigNames[j]];
      }
    }

    this.exec(obj);
    return true;
  }

  exec(obj) {
    if (!obj.d) {
      inquirer__default["default"].prompt(platformConfig).then(this.configProcessService.checkConfig).then(this.configProcessService.createJsonObjectStr).then(this.configProcessService.saveFile);
      return;
    }

    const data = platformConfig.reduce((t, c) => {
      if (!t[c.name]) {
        t[c.name] = c.default || '';
      }

      return t;
    }, {});
    this.configHandler(data);
  }

  configHandler(data) {
    if (fs__default["default"].existsSync(`${join(process.cwd(), getFileName(data.platformName), '.ts')}`) || fs__default["default"].existsSync(`${join(process.cwd(), getFileName(data.platformName), '.js')}`)) {
      error('该环境的配置文件已存在，请确认');
      process.exit(-1);
      return;
    }

    this.configProcessService.checkConfig(data).then(this.configProcessService.createJsonObjectStr).then(this.configProcessService.saveFile);
  }

  getCommandDesc() {
    return this.commandDesc;
  }

  getCommandName() {
    return this.commandName;
  }

}

class AbstractInstallServiceImpl {
  constructor() {
    this.type = '';
    this.command = '';
    this.installCommand = '';
    this.lockFileName = '';
  }

  setNext(next) {
    this.next = next;
  }

  exec() {
    succeed(`执行安装命令${this.installCommand}`);
    return CMD__default["default"].runSync(this.installCommand).err;
  }

  getType() {
    return this.type;
  }

  isLockFile() {
    var readdirSync = fs__namespace.readdirSync(process.cwd());
    const find = readdirSync.find(v => v == this.lockFileName);
    return !!find;
  }

  isSupport() {
    const {
      err,
      data,
      stderr
    } = CMD__default["default"].runSync(this.command + ' -v');
    err && log(`isSupportError: `, err);
    return !err;
  }

  getNext() {
    return this.next;
  }

}

class NpmInstallServiceImpl extends AbstractInstallServiceImpl {
  constructor() {
    super(...arguments);
    this.type = 'npm';
    this.command = 'npm';
    this.installCommand = 'npm install';
    this.lockFileName = 'package-lock.json';
  }

}

class PnpmInstallServiceImpl extends AbstractInstallServiceImpl {
  constructor() {
    super(...arguments);
    this.type = 'pnpm';
    this.command = 'pnpm';
    this.installCommand = 'pnpm install';
    this.lockFileName = 'pnpm-lock.yaml';
  }

}

class YarnInstallServiceImpl extends AbstractInstallServiceImpl {
  constructor() {
    super(...arguments);
    this.type = 'yarn';
    this.command = 'yarn';
    this.installCommand = 'yarn install';
    this.lockFileName = 'yarn.lock';
  }

}

class AbstractDeployComponentService {
  constructor() {
    this.children = [];
  }

  close() {}

  setNextService(service) {
    this.nextService = service;
  }

  getNextService() {
    return this.nextService;
  }

  setChildren(service) {
    this.children.push(service);
  }

  getChildren() {
    return this.children;
  }

  finish() {
    return tslib.__awaiter(this, void 0, void 0, function* () {});
  }

}

class InstallServiceImpl extends AbstractDeployComponentService {
  constructor() {
    super();
    this.config = null;
    this.installType = '';
    var npmInstallServiceImpl = new NpmInstallServiceImpl();
    var pnpmInstallServiceImpl = new PnpmInstallServiceImpl();
    var yarnInstallServiceImpl = new YarnInstallServiceImpl();
    npmInstallServiceImpl.setNext(yarnInstallServiceImpl);
    yarnInstallServiceImpl.setNext(pnpmInstallServiceImpl);
    this.currentService = npmInstallServiceImpl;
    this.service = npmInstallServiceImpl;
  }

  checkConfig(config) {
    if (!config || !config.install) {
      return {
        flag: false,
        data: null
      };
    }

    if (typeof config.install == 'string') {
      this.installType = config.install;
    }

    this.config = config;
    return {
      flag: true,
      data: null
    };
  }

  exec(packages) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      log(`packages: `, packages);

      for (const v of packages) {
        if (v.name === 'root') {
          continue;
        }

        deployHooksUtils.run('preInstall', this.config, v);
        process.chdir(v.path);
        const err = yield this.currentService.exec();

        if (err) {
          log(`error: `, err);
          process.exit(1);
        }

        deployHooksUtils.run('postInstall', this.config, v, this.currentService.getType(), !err);
      }
    });
  }

  getNext() {
    return this.currentService.getNext();
  }

  getType() {
    return this.currentService.getType();
  }

  getSupportChild(service) {
    if (!service) {
      return null;
    }

    if (service.getType() && service.getType().toLocaleLowerCase() == this.installType.toLocaleLowerCase()) {
      return service;
    }

    let result = this.getSupportChild(service.getNext());

    if (result && result.isSupport()) {
      if (result.isLockFile()) {
        return result;
      }
    }

    return service;
  }

  supportHandler() {
    this.currentService = this.service;
    let service = this.getSupportChild(this.currentService);

    if (!service || !service.isSupport()) {
      error('没有支持进行install的工具，请检查');
      process.exit(1);
    }

    this.currentService = service;
    return service;
  }

  isSupport() {
    return this.currentService.isSupport();
  }

  init(config) {
    this.supportHandler();
  }

}

class BuildService extends AbstractDeployComponentService {
  constructor() {
    super();
    this.config = null;
    this.packages = [];
    this.runScripts = [];
    this.waitBuildScripts = [];
    this.results = [];
  }

  buildScriptTransform(waitBuildScripts) {
    let list = [];
    let tempList = [];

    const defaultFileName = (name, command) => name;

    let packages = this.packages;

    if (packages.length > 1) {
      packages = packages.filter(v => v.name != 'root');
    }

    log(`packages: `, packages);

    for (let i in waitBuildScripts) {
      const item = waitBuildScripts[i];
      const postScript = item.postScript ? Array.isArray(item.postScript) ? item.postScript : [item.postScript] : [];
      const serverScript = item.serverScript ? Array.isArray(item.serverScript) ? item.serverScript : [item.serverScript] : [];

      if (!(item.other || item.path || item.pattern)) {
        continue;
      }

      if (!item.command) {
        continue;
      }

      const filter = packages.filter(v => {
        return item.path && v.path.endsWith(item.path) || item.pattern && item.pattern.test(v.path);
      });
      let waitPushData = [];

      if (item.path) {
        if (item.path == '*') {
          waitPushData = packages.map(v => ({
            path: join(v.path),
            command: item.command,
            fileName: item.fileName || defaultFileName,
            postScript,
            serverScript
          }));
        } else {
          if (filter.length) {
            waitPushData.push(...filter.map(v => ({
              path: join(v.path),
              command: item.command,
              fileName: item.fileName || defaultFileName,
              postScript,
              serverScript
            })));
          }
        }
      } else if (item.pattern) {
        if (filter.length) {
          waitPushData.push(...filter.map(v => ({
            path: join(v.path),
            command: item.command,
            fileName: item.fileName || defaultFileName,
            postScript,
            serverScript
          })));
        }
      } else if (item.other) {
        const otherFilter = packages.filter(v => !tempList.find(s => s.path == v.path));
        waitPushData.push(...otherFilter.map(v => ({
          path: join(v.path),
          command: item.command,
          fileName: item.fileName || defaultFileName,
          postScript,
          serverScript
        })));
      }

      if (item.exclude && waitPushData.length) {
        let exclude = Array.isArray(item.exclude) ? item.exclude : [item.exclude];
        exclude = exclude.map(v => {
          if (v instanceof RegExp) {
            return {
              pattern: v
            };
          } else {
            return {
              path: v
            };
          }
        });
        const excludeFilter = waitPushData.filter(v => !exclude.find(s => {
          var _a;

          return v.path && v.path.endsWith(s.path) || v.path && ((_a = s.pattern) === null || _a === void 0 ? void 0 : _a.test(v.path));
        }));
        log(excludeFilter, 'excludeFilter');

        if (excludeFilter.length) {
          waitPushData = excludeFilter;
        }
      }

      list.push(...waitPushData);

      if (item.other) {
        tempList = [];
      } else {
        tempList.push(...waitPushData);
      }
    }

    this.runScripts = list;
    log(`checkScriptList: `, list);
  }

  runScript() {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      if (!this.runScripts.length) {
        return Promise.resolve([]);
      }

      return new Promise((resolve, reject) => tslib.__awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f;

        const results = [];

        for (let v of this.runScripts) {
          deployHooksUtils.run('preBuild', this.config, v);
          process.chdir(v.path);
          const {
            err,
            data,
            stderr
          } = CMD__default["default"].runSync(v.command);

          if (err) {
            error('打包命令执行失败');
            console.log(`err:`, err);
            process.exit(-1);
          }

          console.log(data);
          const fileName = v.fileName(v.path.slice(v.path.lastIndexOf('/') + 1), v.command);

          if (fs__default["default"].existsSync(`${v.path}/${fileName}.zip`)) {
            info(`该文件已存在 ${v.path}/${fileName}.zip，将进行删除操作`);
            fs__default["default"].unlinkSync(`${v.path}/${fileName}.zip`);
          }

          if (fs__default["default"].existsSync(v.path + '/' + ((_a = this.config) === null || _a === void 0 ? void 0 : _a.outputPath))) {
            deleteFolder(v.path + '/' + fileName);
            fs__default["default"].renameSync(v.path + '/' + ((_b = this.config) === null || _b === void 0 ? void 0 : _b.outputPath), v.path + '/' + fileName);
          }

          succeed('开始进行打包zip操作');
          let isZipSuccess = false;
          const output = fs__default["default"].createWriteStream(`${v.path}/${fileName}.zip`).on('error', e => {
            if (e) {
              error(`打包zip出错: ${e}`);
            }
          }).on('finish', () => {
            isZipSuccess = true;
            succeed(`${underline(`${fileName}.zip`)} 打包成功`);
          });
          const archive = archiver__default["default"]('zip');
          archive.pipe(output);
          let waitUploadStaticFileList = [];

          if (((_c = this.config) === null || _c === void 0 ? void 0 : _c.secretId) || ((_d = this.config) === null || _d === void 0 ? void 0 : _d.getTempAuthInfo)) {
            if (fs__default["default"].existsSync(join(v.path, fileName, 'index.html'))) {
              archive.file(join(v.path, fileName, 'index.html'), {
                name: 'index.html'
              });
            } else {
              error('index.html文件不存在');
              process.exit(1);
            }

            if (fs__default["default"].existsSync(join(v.path, fileName, 'favicon.ico'))) {
              archive.file(join(v.path, fileName, 'favicon.ico'), {
                name: 'favicon.ico'
              });
            }

            waitUploadStaticFileList = scanPathList(join(v.path, fileName));
          } else {
            archive.directory(join(v.path, fileName), false);
          }

          yield archive.finalize();

          if (((_e = this.config) === null || _e === void 0 ? void 0 : _e.secretId) || ((_f = this.config) === null || _f === void 0 ? void 0 : _f.getTempAuthInfo)) {
            waitUploadStaticFileList = waitUploadStaticFileList.filter(v => {
              return !['index.html', 'favicon.ico'].includes(v.pathName);
            });
          }

          if (v.postScript.length || this.config.postScript) {
            const postScript = Array.isArray(this.config.postScript) ? this.config.postScript : [this.config.postScript];
            CMD__default["default"].runSync('cd ' + v.path);
            (v.postScript.length ? v.postScript : postScript).map(s => {
              succeed(`开始执行后置脚本命令${s}`);
              const {
                data
              } = CMD__default["default"].runSync(s);
              succeed(`后置脚本输出 ${data}`);
            });
          }

          let serverScript = [];

          if (v.serverScript.length) {
            serverScript = v.serverScript;
          } else if (this.config.serverScript) {
            serverScript = Array.isArray(this.config.serverScript) ? this.config.serverScript : [this.config.serverScript];
          }

          const result = {
            dirPath: v.path,
            fileName,
            filePath: `${v.path}/${fileName}.zip`,
            waitUploadStaticFileList: waitUploadStaticFileList,
            serverScript
          };
          deployHooksUtils.run('postBuild', this.config, v, result);
          yield new Promise(res => {
            let timer = setInterval(() => {
              if (isZipSuccess) {
                clearInterval(timer);
                res(1);
              }
            }, 50);
          });
          results.push(result);
        }

        this.results = results;
        resolve(results);
      }));
    });
  }

  checkConfig(config) {
    if (!config.script || !(config === null || config === void 0 ? void 0 : config.script.length)) {
      error('script参数未指定，请检查');
      process.exit(1);
    }

    if (!config.outputPath) {
      error('未指定outputPath参数，请确认');
      process.exit(1);
    }

    this.config = config;
    const {
      script
    } = config;

    if (Array.isArray(script)) {
      this.waitBuildScripts = script;
    } else {
      this.waitBuildScripts = [{
        path: '*',
        command: script,
        postScript: [],
        serverScript: []
      }];
    }

    return {
      flag: true,
      data: null
    };
  }

  exec() {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      if (!this.waitBuildScripts.length) {
        return Promise.resolve([]);
      }

      this.buildScriptTransform(this.waitBuildScripts);
      return this.runScript();
    });
  }

  init(packages) {
    this.packages = packages;
  }

  finish() {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      if (this.results.length) {
        for (let result of this.results) {
          if (fs__default["default"].existsSync(result.dirPath + '/' + result.fileName)) {
            deleteFolder(result.dirPath + '/' + result.fileName);
          }
        }
      }
    });
  }

}

class AbstractConfigurationParseService {
  constructor() {
    this.packages = [];
    this.file = null;
    this.currentPath = join(process.cwd());
  }

  packagesParseHandle() {
    const packageFiles = [];

    for (let packagename of this.packages) {
      if (packagename.includes('*')) {
        const dir = packagename.replace(/\/\*+/, '');
        const dirList = fs__default["default"].readdirSync(join(this.currentPath, packagename.replace(/\/\*+/, '')));
        packageFiles.push(...dirList.map(s => ({
          name: join(dir, s),
          path: join(this.currentPath, dir, s)
        })));
      } else {
        packageFiles.push({
          name: packagename,
          path: join(this.currentPath, packagename)
        });
      }
    }

    return packageFiles;
  }

  getFile() {
    return this.file;
  }

}

class LernaConfigurationParseService extends AbstractConfigurationParseService {
  constructor() {
    super(...arguments);
    this.type = 'lerna';
    this.filePath = '';
    this.fileName = '';
    this.packages = [];
  }

  readFile(filePath, fileName) {
    this.filePath = filePath;
    this.fileName = fileName;

    try {
      this.file = require(filePath);
      this.packages = this.file && this.file.packages || this.file && this.file.workspaces || [];
    } catch (e) {
      error(`文件读取失败，请检查${fileName}文件`);
    }
  }

  getType() {
    return this.type;
  }

  getFilePath() {
    return this.filePath;
  }

  getFileName() {
    return this.fileName;
  }

}

class PNPMConfigurationParseService extends AbstractConfigurationParseService {
  constructor() {
    super(...arguments);
    this.type = 'PNPM';
    this.filePath = '';
    this.fileName = '';
    this.packages = [];
  }

  readFile(filePath, fileName) {
    this.filePath = filePath;
    this.fileName = fileName;

    try {
      let content = fs__default["default"].readFileSync(filePath, {
        encoding: 'utf8'
      });
      this.file = yaml__default["default"].load(content);
      this.packages = this.file && this.file.packages || [];
    } catch (e) {
      error(`文件读取失败，请检查${fileName}文件`);
    }
  }

  getType() {
    return this.type;
  }

  getFilePath() {
    return this.filePath;
  }

  getFileName() {
    return this.fileName;
  }

}

class ConfigParseService extends AbstractDeployComponentService {
  constructor() {
    super(...arguments);
    this.configurationParseServiceList = [];
    this.packages = [];
  }

  init(data) {}

  exec() {
    return this.packages;
  }

  checkConfig(config) {
    const multipleConfigName = ['lerna.js', 'lerna.json', 'pnpm-workspace.yaml', 'pnpm-workspace.yml'];
    this.configurationParseServiceList = [new LernaConfigurationParseService(), new PNPMConfigurationParseService()];
    let fileList = multipleConfigName.filter(v => fs__default["default"].existsSync(resolve(v)));
    fileList.forEach(v => {
      const find = this.configurationParseServiceList.find(s => v.includes(s.getType().toLocaleLowerCase()) && !s.getFile());

      if (find) {
        find.readFile(resolve(v), v);
      }
    });

    if (fileList.find(v => v.includes('lerna')) && fileList.find(v => v.includes('pnpm'))) {
      info(`因项目同时包含pnpm和lerna，本cli将对2个进行合并处理`);
    }

    this.packages = this.configurationParseServiceList.flatMap(v => v.packagesParseHandle());
    this.packages.unshift({
      path: join(process.cwd()),
      name: 'root'
    });
    log(`packages: `, this.packages);
    return {
      flag: true,
      data: this.packages
    };
  }

}

class AbstractCosServiceImpl {
  constructor() {
    this.cosInstance = null;
    this.cosInfo = null;
    this.COS_UPLOAD_PATH = '/';
    this.tempAuthData = null;
    this.BUCKET = '';
    this.REGION = '';
    this.COS_TYPE = '';
  }

  getType() {
    return this.COS_TYPE;
  }

  setCosInfo(cosInfo) {
    this.cosInfo = cosInfo;
  }

  batchRemoveFile(list) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      for (let item of list) {
        yield this.removeFile(item);
      }
    });
  }

  batchUploadFile(list) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      for (let item of list) {
        yield this.uploadFile(item.fileName, item.path);
      }
    });
  }

  init(cosInfo) {
    return new Promise((resolve, reject) => tslib.__awaiter(this, void 0, void 0, function* () {
      if (!(cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.bucket)) {
        error('bucket信息未指定');
        process.exit(1);
      }

      if (!(cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.region)) {
        error('region信息未指定');
        process.exit(1);
      }

      if (!(cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.cosUploadPath)) {
        error('cos上传目录信息未指定');
        process.exit(1);
      }

      this.BUCKET = cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.bucket;
      this.REGION = cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.region;
      this.COS_UPLOAD_PATH = cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.cosUploadPath;

      if (cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.getTempAuthInfo) {
        this.tempAuthData = yield cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.getTempAuthInfo();

        if (!this.tempAuthData || !Object.keys(this.tempAuthData).length) {
          error('cos信息无效');
          process.exit(1);
        }
      } else {
        if (!(cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.secretId)) {
          error('secretId信息未指定');
          process.exit(1);
        }

        if (!(cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.secretKey)) {
          error('secretKey信息未指定');
          process.exit(1);
        }
      }

      resolve(Object.assign(Object.assign({}, this.tempAuthData), {
        bucket: cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.bucket,
        region: cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.region,
        cosUploadPath: cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.cosUploadPath
      }));
    }));
  }

}

class TencentCosServiceImpl extends AbstractCosServiceImpl {
  constructor() {
    super(...arguments);
    this.COS_UPLOAD_PATH = '/';
    this.tempAuthData = null;
    this.BUCKET = '';
    this.REGION = '';
    this.COS_TYPE = 'tencent';
  }

  init(cosInfo) {
    const _super = Object.create(null, {
      init: {
        get: () => super.init
      }
    });

    return tslib.__awaiter(this, void 0, void 0, function* () {
      const res = yield _super.init.call(this, cosInfo);
      console.log(res, 'res');
      console.log(Cos__default["default"], 'cos', this.COS_TYPE);
      this.cosInstance = new Cos__default["default"]((cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.getTempAuthInfo) ? {
        getAuthorization(options, callback) {
          callback({
            TmpSecretId: res.tmpSecretId,
            TmpSecretKey: res.tmpSecretKey,
            SecurityToken: res.token,
            ExpiredTime: res.expiredTime,
            StartTime: res.startTime
          });
        }

      } : {
        SecretId: res === null || res === void 0 ? void 0 : res.secretId,
        SecretKey: cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.secretKey
      });
      return true;
    });
  }

  removeFile(fileKey) {
    return this.cosInstance.deleteObject({
      Bucket: this.BUCKET,
      Region: this.REGION,
      Key: this.COS_UPLOAD_PATH + fileKey
    }).then(function (data) {
      log(`data: `, data);
    });
  }

  uploadFile(fileName, path) {
    return this.cosInstance.putObject({
      Bucket: this.BUCKET,
      Region: this.REGION,
      Key: this.COS_UPLOAD_PATH + fileName,
      StorageClass: 'STANDARD',
      Body: fs__default["default"].createReadStream(path),
      onProgress: function (progressData) {
        log(`progressData:`, progressData);
      }
    }).then(function (data) {
      log(`data: `, data);
    });
  }

}

class AliyunCosServiceImpl extends AbstractCosServiceImpl {
  constructor() {
    super(...arguments);
    this.COS_UPLOAD_PATH = '/';
    this.tempAuthData = null;
    this.BUCKET = '';
    this.REGION = '';
    this.COS_TYPE = 'aliyun';
    this.cosInstance = null;
  }

  init(cosInfo) {
    const _super = Object.create(null, {
      init: {
        get: () => super.init
      }
    });

    return tslib.__awaiter(this, void 0, void 0, function* () {
      const res = yield _super.init.call(this, cosInfo);
      console.log(res, 'res');
      console.log(Cos__default$1["default"], 'cos', this.COS_TYPE);
      this.cosInstance = new Cos__default$1["default"]({
        accessKeyId: (cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.getTempAuthInfo) ? res.tmpSecretId : cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.secretId,
        accessKeySecret: (cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.getTempAuthInfo) ? res.tmpSecretKey : cosInfo === null || cosInfo === void 0 ? void 0 : cosInfo.secretKey,
        bucket: this.BUCKET,
        region: this.REGION
      });
      return true;
    });
  }

  removeFile(fileKey) {
    return this.cosInstance.delete(this.COS_UPLOAD_PATH + fileKey).then(res => {
      console.log('data :', res);
    }).catch(err => {
      console.log('err: ', err);
    });
  }

  uploadFile(fileName, path) {
    return this.cosInstance.put(this.COS_UPLOAD_PATH + fileName, fs__default["default"].createReadStream(path)).then(res => {
      console.log('data :', res);
    }).catch(err => {
      console.log('err: ', err);
    });
  }

}

class CosServiceImpl extends AbstractDeployComponentService {
  constructor() {
    super(...arguments);
    this.serviceList = [];
    this.config = null;
  }

  checkConfig(config) {
    if ((config === null || config === void 0 ? void 0 : config.secretId) || (config === null || config === void 0 ? void 0 : config.getTempAuthInfo)) {
      if (!config.cosType) {
        config.cosType = 'tencent';
      }

      this.config = config;
      return {
        data: null,
        flag: true
      };
    }

    info('未指定cos相关信息，将跳过cos操作');
    return {
      data: undefined,
      flag: false
    };
  }

  exec(data) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      if (!this.config) {
        return;
      }

      let service;

      for (let item of this.serviceList) {
        if (item.getType() == this.config.cosType) {
          service = item;
          yield item.init(this.config);
          break;
        }
      }

      for (let item of data) {
        deployHooksUtils.run('preCos', this.config, item);

        if (this.config.isRemoveCosFile) {
          yield service.batchRemoveFile([item.fileName]);
        }

        yield service.batchUploadFile(item.waitUploadStaticFileList.map(w => ({
          path: w.path,
          fileName: item.fileName + '/' + w.pathName
        })));
        deployHooksUtils.run('postCos', this.config, item);
      }
    });
  }

  init(data) {
    const tencentCosServiceImpl = new TencentCosServiceImpl();
    const aliyunCosServiceImpl = new AliyunCosServiceImpl();
    this.serviceList.push(tencentCosServiceImpl);
    this.serviceList.push(aliyunCosServiceImpl);
  }

}

class SshService extends AbstractDeployComponentService {
  constructor() {
    super();
    this.config = null;
    this.ssh = new nodeSsh.NodeSSH();
  }

  checkConfig(config) {
    if (config) {
      const errorConditions = [{
        errorTest: !config.host,
        errorTips: '未指定host地址'
      }, {
        errorTest: !config.port,
        errorTips: '未指定port'
      }, {
        errorTest: !config.username,
        errorTips: '未指定username'
      }, {
        errorTest: !config.serverPath,
        errorTips: '未指定serverPath'
      }, {
        errorTest: !config.privateKey && !config.password,
        errorTips: '未指定password或privateKey'
      }];
      const configErrInfo = errorConditions.find(item => item.errorTest);

      if (configErrInfo) {
        error(configErrInfo.errorTips);
        process.exit(1);
      }

      this.config = config;
      return {
        data: undefined,
        flag: true
      };
    }

    return {
      data: undefined,
      flag: false
    };
  }

  removeRemoteFile(path) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      try {
        if (this.config.isRemoveServerFile) {
          info(`删除远程文件 ${underline(path)}`);
          yield this.ssh.execCommand(`rm -rf ${path}`);
        }
      } catch (e) {
        error(e);
        process.exit(1);
      }
    });
  }

  removeZipFile(path) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      const localPath = path;
      info(`删除本地打包文件 ${underline(localPath)}`);
      fs__namespace.unlinkSync(localPath);
      succeed('删除本地打包文件成功');
    });
  }

  uploadLocalFile(localFilePath, remoteFilePath) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      try {
        const localFileName = localFilePath;
        const remoteFileName = remoteFilePath;
        info(`上传打包zip至目录 ${underline(remoteFileName)}`);
        const spinner = ora__default["default"]('正在上传中\n').start();
        yield this.ssh.putFile(localFileName, remoteFileName, null, {
          concurrency: 1
        }).then(null, err => {
          err && console.log(`error: `, err);
          process.exit(1);
        });
        spinner.stop();
        succeed('上传成功');
      } catch (e) {
        error(`上传失败: ${e}`);
        process.exit(1);
      }
    });
  }

  unzipRemoteFile(fileName) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      const {
        serverPath
      } = this.config;
      const remoteFileName = `${serverPath}/${fileName}`;
      info(`解压远程文件 ${underline(remoteFileName)}`);
      yield this.ssh.execCommand(`unzip -o ${remoteFileName} -d ${serverPath}/${fileName.slice(0, fileName.lastIndexOf('.zip'))} && rm -rf ${remoteFileName}`).then(({
        stderr
      }) => {
        if (stderr) {
          error('STDERR: ' + stderr);
          process.exit(1);
          return Promise.reject(stderr);
        }

        succeed(`解压 ${fileName} 成功 `);
      }).catch(err => {
        if (err.includes('unzip: command not found')) {
          info('yum 自动安装 unzip...');
          this.ssh.execCommand('yum install -y unzip zip').then(({
            stderr
          }) => {
            if (!stderr) {
              this.unzipRemoteFile(fileName);
            }
          });
        } else {
          process.exit(1);
        }
      });
    });
  }

  backRemoteFile(path) {
    var _a, _b, _c, _d, _e;

    return tslib.__awaiter(this, void 0, void 0, function* () {
      if ((_a = this.config) === null || _a === void 0 ? void 0 : _a.isBakFile) {
        let backFileName;

        if ((_b = this.config) === null || _b === void 0 ? void 0 : _b.bakFileName) {
          backFileName = typeof ((_c = this.config) === null || _c === void 0 ? void 0 : _c.bakFileName) == 'string' ? (_d = this.config) === null || _d === void 0 ? void 0 : _d.bakFileName : (_e = this.config) === null || _e === void 0 ? void 0 : _e.bakFileName(path.slice(path.lastIndexOf('/') + 1));
        } else {
          backFileName = path.slice(path.lastIndexOf('/') + 1) + '-bak-' + dayjs__default["default"]().format('YYYYMMDDHHmmss');
        }

        yield this.ssh.execCommand(`[ -d ${path} ] && cp -r ${path} ${path.slice(0, path.lastIndexOf('/') + 1) + backFileName} || echo no`);
      }
    });
  }

  runServiceScript(dir, command) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      succeed(`进入目录 ${dir}`);
      yield this.ssh.execCommand(`cd ${dir}`);

      for (let i of command) {
        succeed(`开始执行脚本 ${i}`);
        const find = notAllowedShellScript.find(v => v.test(i));

        if (find) {
          error(`因安全策略限制，无法执行该命令 ${i} , 请修改`);
          continue;
        }

        let flag = false;
        yield this.ssh.execCommand(`${i}`).then(({
          stdout,
          stderr
        }) => {
          info(`执行脚本输出: ${JSON.stringify(stdout)}`);

          if (stderr) {
            flag = true;
          }
        });

        if (flag) {
          break;
        }
      }
    });
  }

  checkServerPathExist(path) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      yield this.ssh.execCommand(`[ -d ${path} ] && echo yes || mkdir -p ${path}`);
    });
  }

  exec(buildList) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      if (this.config) {
        try {
          deployHooksUtils.run('preConnectServer', this.config);
          yield this.ssh.connect(Object.assign({}, this.config));
          deployHooksUtils.run('connectServerSuccess', this.config);

          for (let i of buildList) {
            deployHooksUtils.run('preDeploy', this.config, i);
            const commands = i.serverScript;
            yield this.checkServerPathExist(this.config.serverPath);
            yield this.uploadLocalFile(i.filePath, this.config.serverPath + '/' + i.fileName + '.zip');
            yield this.removeZipFile(i.filePath);
            yield this.backRemoteFile(this.config.serverPath + '/' + i.fileName);
            yield this.removeRemoteFile(this.config.serverPath + '/' + i.fileName);
            yield this.unzipRemoteFile(i.fileName + '.zip');
            yield this.runServiceScript(i.fileName, commands);
            deployHooksUtils.run('postDeploy', this.config, i, this.config.serverPath + '/' + i.fileName);
          }

          this.ssh.dispose();
          deployHooksUtils.run('closeServer', this.config);
        } catch (e) {
          error(e);
          process.exit(1);
        }
      }
    });
  }

  init(data) {}

}

class ProcessEvent {
  constructor() {
    this.processEventList = ['exit', 'message', 'uncaughtException'];
  }

  onProcess(processEvent) {
    const isExistList = processEvent && processEvent.includes(processEvent);

    if (processEvent && !isExistList) {
      this.processEventList.push(processEvent);
    }

    this.processEventList.forEach(item => {
      process.on(item, err => {
        err && console.log(`process_${item}: ${err}`);
      });
    });
  }

}
const onProcessEvent = new ProcessEvent();

class DeployService {
  constructor() {
    this.configPaths = [];
    this.configFileNames = [];
    this.configFile = null;
    this.configBranch = [];
    this.commandConfigs = null;
    let configParseService = new ConfigParseService();
    let installServiceImpl = new InstallServiceImpl();
    let buildService = new BuildService();
    let cosService = new CosServiceImpl();
    let sshService = new SshService();
    configParseService.setChildren(installServiceImpl);
    configParseService.setNextService(buildService);
    buildService.setChildren(cosService);
    buildService.setNextService(sshService);
    this.service = configParseService;
  }

  init(obj) {
    let fileNames = obj.mode ? [`${obj.mode}.${DEFAULT_FILE_NAME}.ts`, `${obj.mode}.${DEFAULT_FILE_NAME}.js`, `${DEFAULT_FILE_NAME}.ts`, `${DEFAULT_FILE_NAME}.js`] : [`${DEFAULT_FILE_NAME}.ts`, `${DEFAULT_FILE_NAME}.js`];
    const filePaths = fileNames.map(v => resolve(v)).filter(v => fs__default["default"].existsSync(v));
    fileNames = fileNames.filter(v => fs__default["default"].existsSync(resolve(v)));
    const isModeFile = filePaths.some(item => item.startsWith(`${obj.mode}.${DEFAULT_FILE_NAME}`));
    const isFile = filePaths.some(item => item.startsWith(`${DEFAULT_FILE_NAME}`));

    if (obj.mode && !isModeFile) {
      error(`找不到${obj.mode + '.' + DEFAULT_FILE_NAME}文件，请检查！`);
      process.exit(-1);
    }

    if (!obj.mode && !isFile) {
      error(`找不到${DEFAULT_FILE_NAME}文件，请检查！`);
      process.exit(-1);
    }

    if (filePaths.length == 0) {
      error(`找不到${obj.mode ? obj.mode + '.' + DEFAULT_FILE_NAME : DEFAULT_FILE_NAME}文件，请检查！`);
      process.exit(-1);
    }

    this.configPaths = filePaths;
    this.configFileNames = fileNames;
    log(`configPaths: `, this.configPaths);
    log(`configFileNames: `, this.configFileNames);
  }

  readConfigFile() {
    const allFieldNames = platformConfig.map(v => v.name);
    const dirPath = process.cwd();
    process.chdir(__dirname);

    for (let i in this.configPaths) {
      const fileName = this.configFileNames[i];
      const filePath = this.configPaths[i];

      try {
        log(`filePath: `, filePath);
        log(`fileName: `, fileName);
        const localFile = readLocalFile(filePath);
        log(`localFile: `, localFile);
        this.configFile = Object.assign({}, this.configFile, localFile.default);

        if (this.commandConfigs) {
          for (let commandConfigsKey in this.commandConfigs) {
            if (this.commandConfigs[commandConfigsKey] && allFieldNames.includes(commandConfigsKey)) {
              this.configFile[commandConfigsKey] = this.commandConfigs[commandConfigsKey];
            }
          }
        }
      } catch (e) {
        console.log(`error: `, e);
        error(`${fileName}文件读取失败, 请检查！`);
        process.exit(1);
      }
    }

    process.chdir(dirPath);
  }

  run(obj) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
      this.commandConfigs = obj;
      onProcessEvent.onProcess();
      this.init(obj);
      this.readConfigFile();
      deployHooksUtils.run('start', this.configFile);
      let service = this.service;
      let preData;
      let execData;

      while (service) {
        const init = service.init(preData);

        if (init instanceof Promise) {
          yield init;
        }

        const result = service.checkConfig(this.configFile);

        if (result.flag) {
          let data = service.exec(execData);

          if (data instanceof Promise) {
            data = yield data;
          }

          service.close();
          preData = result.data;
          execData = data;

          if (service.getChildren().length) {
            for (let i of service.getChildren()) {
              const init = i.init(preData);

              if (init instanceof Promise) {
                yield init;
              }

              const result = i.checkConfig(this.configFile);

              if (result.flag) {
                const tmp = i.exec(execData);

                if (tmp instanceof Promise) {
                  yield tmp;
                }

                i.close();
              }
            }
          }

          yield service.finish();
        }

        service = service.getNextService();
      }

      deployHooksUtils.run('finish', this.configFile);
      process.exit();
    });
  }

}

class DeployCommand {
  constructor() {
    this.deployService = new DeployService();
    this.commandName = 'deploy';
    this.allowConfigNames = {
      mode: '',
      projectName: '',
      platformName: '',
      script: '',
      install: false,
      postScript: '',
      outputPath: '',
      host: '',
      port: 0,
      username: '',
      password: '',
      privateKey: '',
      passphrase: '',
      cosType: 'tencent',
      bucket: '',
      region: '',
      cosUploadPath: '',
      isRemoveCosFile: false,
      serverPath: '',
      isBakFile: false,
      bakFileName: '',
      isRemoveServerFile: false,
      serverScript: ''
    };
    this.commandDesc = [{
      command: this.commandName,
      desc: '部署默认环境应用'
    }, {
      command: `${this.commandName} --mode=dev`,
      desc: '部署默认环境dev分支'
    }, {
      command: `${this.commandName} --mode=dev --host=127.0.0.1 --port=22 --username=root --password=123 --privateKey=key --passphrase=123`,
      desc: '部署默认环境dev分支,并且可通过参数注入覆盖配置文件内部的配置'
    }];
  }

  run(commandName, args) {
    if (commandName != this.commandName) {
      return false;
    }

    let obj = {};

    for (let j in this.allowConfigNames) {
      if (args[j] != null) {
        obj[j] = args[j];
      }
    }

    this.exec(obj);
    return true;
  }

  exec(obj) {
    const newObj = {};
    Object.keys(this.allowConfigNames).forEach(item => {
      if (obj[item]) {
        newObj[item] = obj[item];
      }
    });
    this.deployService.run(newObj);
  }

  getCommandDesc() {
    return this.commandDesc;
  }

  getCommandName() {
    return this.commandName;
  }

}

class Command {
  constructor() {
    this.commandList = [];
    this.commandList.push(new InitCommand());
    this.commandList.push(new DeployCommand());
    const repeatObj = {};

    for (let i = 0; i < this.commandList.length; i++) {
      if (!this.commandList[i].getCommandName()) {
        error('command文件没有commandName参数，请检查');
        process.exit(-1);
      }

      if (!repeatObj[this.commandList[i].getCommandName()]) {
        repeatObj[this.commandList[i].getCommandName()] = 1;
      } else {
        error(`commandName参数值【${this.commandList[i].getCommandName()}】有重名，请检查`);
        process.exit(-1);
      }
    }
  }

  getCommandDesc() {
    return this.commandList.flatMap(v => v.getCommandDesc());
  }

  execCommand(commandName, args) {
    let hasRun = false;

    for (let command of this.commandList) {
      if (command.run(commandName, args)) {
        hasRun = true;
        break;
      }
    }

    if (!hasRun) {
      error('不支持该命令，请通过-h查看');
      process.exit(-1);
    }
  }

}

class EntryService {
  constructor(argv) {
    this.command = new Command();
    this.argv = [];
    this.argv = argv || [];
  }

  run() {
    onProcessEvent.onProcess();
    this.parseArgs();
  }

  parseArgs() {
    const args = minimist__default["default"](this.argv.slice(2), {
      alias: {
        version: ['v'],
        help: ['h']
      },
      boolean: ['version', 'help']
    });
    const command = args._[0];
    map.set('command', command);
    map.set('args', args);
    map.set('debug', args.debug);
    log(`command`, command);
    log(`args`, args);

    if (command) {
      this.command.execCommand(command, args);
    } else {
      if (args.v) {
        console.log(`Version: ${getVersion()}`);
      } else {
        const loggerTips = ['Usage: kamisiro-deploy-cli [Options] Or kamisiro-deploy-cli <command> [options]', 'Options:', '  -v, --version  查询版本号', '  -h, --help     显示帮助', '  --debug        输出详细日志', 'Commands:'];
        loggerTips.forEach(item => {
          console.log('info', item);
        });
        const commandDesc = this.command.getCommandDesc();
        commandDesc.forEach(v => {
          console.log('info', `  ${v.command}      ${v.desc}`);
        });
      }
    }
  }

}

exports.EntryService = EntryService;
exports.defineConfig = defineConfig;
.length == 0) {
          error(`找不到${obj.mode ? obj.mode + '.' + DEFAULT_FILE_NAME : DEFAULT_FILE_NAME}文件，请检查！`);
          process.exit(-1);
        }

        this.configPaths = filePaths;
        this.configFileNames = fileNames;
        log(`configPaths: `, this.configPaths);
        log(`configFileNames: `, this.configFileNames);
      }

      readConfigFile() {
        const allFieldNames = platformConfig.map(v => v.name);
        const dirPath = process.cwd();
        process.chdir(__dirname);

        for (let i in this.configPaths) {
          const fileName = this.configFileNames[i];
          const filePath = this.configPaths[i];

          try {
            log(`filePath: `, filePath);
            log(`fileName: `, fileName);
            const localFile = readLocalFile(filePath);
            log(`localFile: `, localFile);
            this.configFile = Object.assign({}, this.configFile, localFile.default);

            if (this.commandConfigs) {
              for (let commandConfigsKey in this.commandConfigs) {
                if (this.commandConfigs[commandConfigsKey] && allFieldNames.includes(commandConfigsKey)) {
                  this.configFile[commandConfigsKey] = this.commandConfigs[commandConfigsKey];
                }
              }
            }
          } catch (e) {
            console.log(`error: `, e);
            error(`${fileName}文件读取失败, 请检查！`);
            process.exit(1);
          }
        }

        process.chdir(dirPath);
      }

      run(obj) {
        return tslib.__awaiter(this, void 0, void 0, function* () {
          this.commandConfigs = obj;
          onProcessEvent.onProcess();
          this.init(obj);
          this.readConfigFile();
          deployHooksUtils.run('start', this.configFile);
          let service = this.service;
          let preData;
          let execData;

          while (service) {
            const init = service.init(preData);

            if (init instanceof Promise) {
              yield init;
            }

            const result = service.checkConfig(this.configFile);

            if (result.flag) {
              let data = service.exec(execData);

              if (data instanceof Promise) {
                data = yield data;
              }

              service.close();
              preData = result.data;
              execData = data;

              if (service.getChildren().length) {
                for (let i of service.getChildren()) {
                  const init = i.init(preData);

                  if (init instanceof Promise) {
                    yield init;
                  }

                  const result = i.checkConfig(this.configFile);

                  if (result.flag) {
                    const tmp = i.exec(execData);

                    if (tmp instanceof Promise) {
                      yield tmp;
                    }

                    i.close();
                  }
                }
              }

              yield service.finish();
            }

            service = service.getNextService();
          }

          deployHooksUtils.run('finish', this.configFile);
          process.exit();
        });
      }

    }

    class DeployCommand {
      constructor() {
        this.deployService = new DeployService();
        this.commandName = 'deploy';
        this.allowConfigNames = {
          mode: '',
          projectName: '',
          platformName: '',
          script: '',
          install: false,
          postScript: '',
          outputPath: '',
          host: '',
          port: 0,
          username: '',
          password: '',
          privateKey: '',
          passphrase: '',
          cosType: 'tencent',
          bucket: '',
          region: '',
          cosUploadPath: '',
          isRemoveCosFile: false,
          serverPath: '',
          isBakFile: false,
          bakFileName: '',
          isRemoveServerFile: false,
          serverScript: ''
        };
        this.commandDesc = [{
          command: this.commandName,
          desc: '部署默认环境应用'
        }, {
          command: `${this.commandName} --mode=dev`,
          desc: '部署默认环境dev分支'
        }, {
          command: `${this.commandName} --mode=dev --host=127.0.0.1 --port=22 --username=root --password=123 --privateKey=key --passphrase=123`,
          desc: '部署默认环境dev分支,并且可通过参数注入覆盖配置文件内部的配置'
        }];
      }

      run(commandName, args) {
        if (commandName != this.commandName) {
          return false;
        }

        let obj = {};

        for (let j in this.allowConfigNames) {
          if (args[j] != null) {
            obj[j] = args[j];
          }
        }

        this.exec(obj);
        return true;
      }

      exec(obj) {
        const newObj = {};
        Object.keys(this.allowConfigNames).forEach(item => {
          if (obj[item]) {
            newObj[item] = obj[item];
          }
        });
        this.deployService.run(newObj);
      }

      getCommandDesc() {
        return this.commandDesc;
      }

      getCommandName() {
        return this.commandName;
      }

    }

    class Command {
      constructor() {
        this.commandList = [];
        this.commandList.push(new InitCommand());
        this.commandList.push(new DeployCommand());
        const repeatObj = {};

        for (let i = 0; i < this.commandList.length; i++) {
          if (!this.commandList[i].getCommandName()) {
            error('command文件没有commandName参数，请检查');
            process.exit(-1);
          }

          if (!repeatObj[this.commandList[i].getCommandName()]) {
            repeatObj[this.commandList[i].getCommandName()] = 1;
          } else {
            error(`commandName参数值【${this.commandList[i].getCommandName()}】有重名，请检查`);
            process.exit(-1);
          }
        }
      }

      getCommandDesc() {
        return this.commandList.flatMap(v => v.getCommandDesc());
      }

      execCommand(commandName, args) {
        let hasRun = false;

        for (let command of this.commandList) {
          if (command.run(commandName, args)) {
            hasRun = true;
            break;
          }
        }

        if (!hasRun) {
          error('不支持该命令，请通过-h查看');
          process.exit(-1);
        }
      }

    }

    class EntryService {
      constructor(argv) {
        this.command = new Command();
        this.argv = [];
        this.argv = argv || [];
      }

      run() {
        onProcessEvent.onProcess();
        this.parseArgs();
      }

      parseArgs() {
        const args = minimist__default["default"](this.argv.slice(2), {
          alias: {
            version: ['v'],
            help: ['h']
          },
          boolean: ['version', 'help']
        });
        const command = args._[0];
        map.set('command', command);
        map.set('args', args);
        map.set('debug', args.debug);
        log(`command`, command);
        log(`args`, args);

        if (command) {
          this.command.execCommand(command, args);
        } else {
          if (args.v) {
            console.log(`Version: ${getVersion()}`);
          } else {
            const loggerTips = ['Usage: kamisiro-deploy-cli [Options] Or kamisiro-deploy-cli <command> [options]', 'Options:', '  -v, --version  查询版本号', '  -h, --help     显示帮助', '  --debug        输出详细日志', 'Commands:'];
            loggerTips.forEach(item => {
              console.log('info', item);
            });
            const commandDesc = this.command.getCommandDesc();
            commandDesc.forEach(v => {
              console.log('info', `  ${v.command}      ${v.desc}`);
            });
          }
        }
      }

    }

    exports.EntryService = EntryService;
    exports.defineConfig = defineConfig;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
