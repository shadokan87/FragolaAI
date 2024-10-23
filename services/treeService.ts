import tree from 'tree-cli';
import dirTree from 'directory-tree';
import { config } from '../main.ts';
export const fileIdToPath: Map<number, string> = new Map();

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

export class TreeService {
  constructor(private cwd: string = process.env.PWD!) { }

  setCwd(path: string): TreeService {
    this.cwd = path;
    return this;
  }

  async list(option: { report: boolean } = { report: false }) {
    let id = 0;
    const filteredTree = dirTree(this.cwd, { exclude: [/node_modules/] , attributes: ['type']},(item) => {
      // item.custom = {realPath: item.path};
      fileIdToPath.set(id, item.path);
      item.path = item.path.slice(config.projectRoot.length);
      item.custom = {id: id++}
    },(dir) => {
      dir.path = dir.path.slice(config.projectRoot.length);
      dir.path = dir.path == "" ? "/" : dir.path; 
    } );
    return filteredTree
  }
}