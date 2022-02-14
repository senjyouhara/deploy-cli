import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git'

export class GitInit {
  git: SimpleGit
  gitOptions: Partial<SimpleGitOptions> = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 10,
  }
  constructor(options?: Partial<SimpleGitOptions>) {
    this.gitOptions = Object.assign(this.gitOptions, options)
    this.git = simpleGit(this.gitOptions)
  }
}
