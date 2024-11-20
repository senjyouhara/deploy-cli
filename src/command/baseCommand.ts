export default interface IBaseCommand {
  run: (commandName: string, args: any) => boolean;
  exec: (obj: any) => void;
  getCommandDesc: () => { command: string; desc: string }[];
  getCommandName: () => string;
}
