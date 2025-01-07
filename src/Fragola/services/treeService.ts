import dirTree from 'directory-tree';
import { MD5 } from 'crypto-js';


export interface treeReport {
  type: 'report',
  directories?: number,
  files?: number
}

export interface treeResult {
  name: string;
  type: 'file' | 'directory';
  contents?: treeResult[];
}

export type ListResult = Array<treeResult | treeReport>;

export class TreeService {
  constructor(private cwd: string = process.env.PWD!, private workspaceRoot: string) { }

  setCwd(path: string): TreeService {
    this.cwd = path;
    return this;
  }

  async list() {
    const filteredTree = dirTree(this.cwd, { exclude: [/node_modules/], attributes: ['type'] }, (item) => {
      item.path = item.path.slice(this.workspaceRoot.length);
      const id = MD5(item.path).toString();
      item.custom = { id };
    }, (dir) => {
      dir.path = dir.path.slice(this.workspaceRoot.length);
      dir.path = dir.path == "" ? "/" : dir.path;
    });
    return filteredTree;
  }
}