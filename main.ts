import OpenAI from "openai"
import { allAgents, systemPrompts } from "./constants/prompts"
import { join } from "path";
import { addService } from "./services";
import { TaskScheduler } from "./services/taskSchedulerService";
import { TreeService } from "./services/treeService";
import { ToolManager } from "./tools/toolManager";
import { searchFileByExpr, searchFileByExprIdentity, searchFileByExprSchema } from "./tools/navigation/searchFileByExpr";
import { grepCodeBase, grepCodeBaseIdentity, grepCodeBaseSchema } from "./tools/navigation/grepCodeBase";
import { readFileById, readFileByIdIdentity, readFileByIdSchema } from "./tools/navigation/readFileById";
import { getProjectStructure, getProjectStructureIdentity } from "./tools/navigation/getProjectStructure";
import { codeGenTaskIdentity, codeGenTaskSchema } from "./tools/planning/codeGenTask";
import { agentPlanner } from "./agents/planner/planner";

(() => {
    if (!process.env.FRAGOLA_PATH) throw new Error("FRAGOLA_PATH undefined");
  })();
  
  export let config = {
    projectRoot: `${join(process.env.FRAGOLA_PATH, "mocks/clang")}`,
  };
  export const toolManager = new ToolManager();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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",
  defaultHeaders: {

  }
})

async function main() {
    addService('tree', TreeService, config.projectRoot);
    addService('taskScheduler', TaskScheduler);
    // Navigation
    toolManager.createTool(searchFileByExpr, searchFileByExprIdentity, searchFileByExprSchema);
    toolManager.createTool(grepCodeBase, grepCodeBaseIdentity, grepCodeBaseSchema);
    toolManager.createTool(readFileById, readFileByIdIdentity, readFileByIdSchema);
    toolManager.createTool(getProjectStructure, getProjectStructureIdentity);
    // Planning
    toolManager.createTool(() => {}, codeGenTaskIdentity, codeGenTaskSchema);
    let defaultSys = systemPrompts.find(elem => elem.name == "planner")?.content;
    if (!defaultSys)
      throw new Error("System prompt for planner not found");
    const prompt = "refactor this project, each functions must be in its own file with the format <function_name>.c, create also a makefile and library .h";
    const response = await agentPlanner(openai, [{
      role: "system",
      content: defaultSys,
    },
  {
    role: "user",
    content: prompt
  }]);
  console.log(JSON.stringify(response, null, 2));

  
    // console.log(toolManager.getToolByFamilly("navigation"));
    // console.log(allAgents);
    // console.log(systemPrompts);
//   const completion = await openai.chat.completions.create({
//     model: "meta-llama/llama-3.1-70b-instruct:free",
//     messages: [
//       {
//         "role": "user",
//         "content": "What is the meaning of life?"
//       }
//     ]
//   })

}
main()