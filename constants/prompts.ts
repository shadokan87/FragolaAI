import { $ } from "bun";
import { join } from "path";

export const allAgents: string[] = (await $`find . -type d -maxdepth 1`.cwd(join(process.env.PWD!, "agents")).text()).split('\n').filter((elem) => {
    return elem.length > 1
}).map(elem => elem.split('./').at(-1)).filter(str => str != undefined) || [];

export const systemPrompts: { name: string, content: string }[] = await Promise.all(allAgents.map(async name => {
    try {
        const response = await $`cat ${join(process.env.PWD!, 'agents', name, 'prompts', 'defaultSys.md')
            }`;
        return { name, content: response.text() };
    } catch (e) {
        console.error(`Failed to load system prompt for agent ${name}`);
        // process.exit(1);
    }
})).then(res => res.filter(v => v != undefined));