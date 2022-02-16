import AbstractInstallServiceImpl from './abstractInstallServiceImpl'

export default class NpmInstallServiceImpl extends AbstractInstallServiceImpl {
  type = 'npm'
  command = 'npm'
  installCommand = 'npm install'
  lockFileName = 'package-lock.json'
}
