import AbstractInstallServiceImpl from './abstractInstallServiceImpl';

export default class PnpmInstallServiceImpl extends AbstractInstallServiceImpl {
  type = 'pnpm';
  command = 'pnpm';
  installCommand = 'pnpm install';
  lockFileName = 'pnpm-lock.yaml';
}
