import AbstractInstallServiceImpl from './abstractInstallServiceImpl';

export default class YarnInstallServiceImpl extends AbstractInstallServiceImpl {
  type = 'yarn';
  command = 'yarn';
  installCommand = 'yarn install';
  lockFileName = 'yarn.lock';
}
