export default interface InstallService {
  isSupport(): boolean
  isLockFile(): boolean
  exec(): any
  getType(): string
  getNext(): InstallService | undefined
}
