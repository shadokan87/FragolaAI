export class NonZeroExitCode extends Error {
    stderr: string | undefined;
    constructor(message: string, stderr?: string) {
        super(message);
        this.stderr = stderr;
    }
}
