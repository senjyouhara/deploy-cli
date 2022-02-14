import { loggerConfigure } from './loggerConfigure'
import { PrintLogger } from './loggerConfigure.type'

const printger: PrintLogger = new PrintLogger(loggerConfigure)
export const logger = printger.logger
// logger.info('')
