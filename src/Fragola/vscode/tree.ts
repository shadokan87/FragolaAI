import { TreeResult, TreeService } from "../../services/treeService";
import { FragolaVscodeBase } from "./types";

export class Tree extends FragolaVscodeBase {
    constructor(cwd: string | undefined, protected result: TreeResult | undefined = undefined) {
        super();
        this.initialize(cwd);
    }

    getResult() {
        return this.result;
    }

    private async initialize(cwd: string | undefined) {
        if (!cwd) {
            //TODO: handle error
            return ;
        }
        this.result = await new TreeService(cwd, cwd).list();
        console.log("__TREE__", this.result);
    }
}