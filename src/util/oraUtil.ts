import ora from 'ora'
import chalk from 'chalk'

// 成功信息
export const succeed = (...message: string[]) => {
  ora().succeed(chalk.greenBright.bold(message))
}
// 提示信息
export const info = (...message: string[]) => {
  ora().info(chalk.blueBright.bold(message))
}
// 错误信息
export const error = (...message: string[]) => {
  ora().fail(chalk.redBright.bold(message))
}

// loading
export const loading = (...message: string[]) => {
  return ora(chalk.cyan(message)).start()
}

// 下划线
export const underline = (...message: string[]) => {
  return chalk.underline.blueBright.bold(message)
}
