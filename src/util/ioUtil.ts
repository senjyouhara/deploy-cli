import fs from 'fs';
export const saveFile = (path: string, data: string | NodeJS.ArrayBufferView) => {
  fs.writeFileSync(path, data, { encoding: 'utf8' });
};

export function deleteFolder(path: string) {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach((file, index) => {
      let curPath = `${path}/${file}`;
      if (fs.statSync(curPath).isDirectory()) {
        deleteFolder(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}
