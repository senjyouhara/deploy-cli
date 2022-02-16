import { logger } from '../logger'

export class ProcessEvent {
  processEventList: string[] = ['exit', 'message', 'uncaughtException']

  onProcess(processEvent?: string) {
    const isExistList = processEvent && processEvent.includes(processEvent)
    if (processEvent && !isExistList) {
      this.processEventList.push(processEvent)
    }
    this.processEventList.forEach(item => {
      process.on(item, err => {
        logger.warn(`process_${item}: ${JSON.stringify(err)}`)
      })
    })
  }
}

export const onProcessEvent: ProcessEvent = new ProcessEvent()
