import { services } from "../../services"
import type { toolIdentity } from "../toolManager"

export async function getProjectStructure() {
    return JSON.stringify(await services.tree?.list())
}

export const getProjectStructureIdentity: toolIdentity = {
    familly: "navigation",
    name: "getProjectStructure",
    description: "returns the strucutre of the project. with each files and folders. similar to tree executable",
}