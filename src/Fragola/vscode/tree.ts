import { TreeResult, TreeService } from "../../services/treeService";
import { FragolaVscodeBase } from "./types";

export class Tree extends FragolaVscodeBase {
    constructor(private cwd: string | undefined, protected result: TreeResult | undefined = undefined, public idToPath: Map<TreeResult["custom"]["id"], string> = new Map()) {
        super();
        this.initialize(cwd);
    }

    getResult() {
        return this.result;
    }

    getCwd() {
        return this.cwd
    }

    getIdFromPath(path: string): TreeResult["custom"]["id"] | null {
        for (const [id, storedPath] of this.idToPath) {
            if (storedPath === path) {
                return id;
            }
        }
        return null;
    }

    private async initialize(cwd: string | undefined) {
        if (!cwd) {
            //TODO: handle error
            return ;
        }
        this.result = await new TreeService(cwd, cwd, (id, path) => {
            this.idToPath.set(id, path);
        }).list();
        this.cwd = cwd;
        console.log("__TREE__", this.result);
        console.log("__MAP__", this.idToPath)
    }
}