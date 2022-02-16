import IDeployComponentService from './iDeployComponentService'

export default abstract class AbstractDeployComponentService implements IDeployComponentService {
  protected nextService: AbstractDeployComponentService | undefined
  protected children: AbstractDeployComponentService[] = []
  abstract init(data: any): any
  abstract checkConfig(config: any, arg?: any): { flag: boolean; data: any }

  close(): void {}

  abstract exec(arg?: any): any

  setNextService(service: AbstractDeployComponentService): void {
    this.nextService = service
  }

  getNextService(): AbstractDeployComponentService {
    return this.nextService!
  }

  setChildren(service: AbstractDeployComponentService): void {
    this.children.push(service)
  }
  getChildren(): AbstractDeployComponentService[] {
    return this.children
  }

  async finish(): Promise<void> {}
}
