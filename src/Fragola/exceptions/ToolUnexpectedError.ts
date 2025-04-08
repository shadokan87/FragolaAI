export class ToolUnexpectedError extends Error {
    constructor(message: string, public readonly toolName: string, private originalError: any | undefined = undefined) {
        super(`Unexpected error in tool ${toolName}: ${message}`);
        this.name = 'ToolUnexpectedError';
    }
}
