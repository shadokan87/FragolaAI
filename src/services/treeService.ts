import dirTree from 'directory-tree';
import { MD5 } from 'crypto-js';

interface custom {
  id: string
}

export interface TreeResult<T = custom> {
  name: string,
  path: string,
  type: "file" | "folder",
  custom: T,
  children?: TreeResult[]
}

export class TreeService {
  constructor(private cwd: string = process.env.PWD!, private workspaceRoot: string) { }

  setCwd(path: string): TreeService {
    this.cwd = path;
    return this;
  }

  async list(): Promise<TreeResult> {
    const filteredTree = dirTree(this.cwd, { exclude: [/node_modules/], attributes: ['type'] }, (item) => {
      item.path = item.path.slice(this.workspaceRoot.length);
      const id = MD5(item.path).toString();
      item.custom = { id };
    }, (dir) => {
      dir.path = dir.path.slice(this.workspaceRoot.length);
      dir.path = dir.path == "" ? "/" : dir.path;
    });
    return filteredTree as unknown as TreeResult;
  }
}