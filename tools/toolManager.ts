import { z } from "zod";

type toolFamilly = "navigation" | "planning";

export interface toolIdentity {
    familly: toolFamilly,
    name: string,
    description: string,
}

type tool = toolIdentity & { fn: any, schema?: z.ZodType<any, any> };

export class ToolManager {
    constructor(private tool: tool[] = []) {

    }

    getToolByFamilly(familly: toolFamilly) {
        return this.tool.filter(tool => tool.familly == familly);
    }

    getAll() {
        return this.tool;
    }

    createTool<T extends z.ZodType<any, any>>(fn: any, identity: toolIdentity, schema?: T) {
        const tool = {
            fn,
            ...identity,
            schema
        }
        this.tool.push(tool);
        return tool;
    }
}