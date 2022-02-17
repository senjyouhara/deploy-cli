
export class ProcessEvent {
  processEventList: string[] = ['exit', 'message', 'uncaughtException']

  onProcess(processEvent?: string) {
    const isExistList = processEvent && processEvent.includes(processEvent)
    if (processEvent && !isExistList) {
      this.processEventList.push(processEvent)
    }
    this.processEventList.forEach(item => {
      process.on(item, err => {
        err && console.log(`process_${item}: ${err}`)
      })
    })
  }
}

export const onProcessEvent: ProcessEvent = new ProcessEvent()
