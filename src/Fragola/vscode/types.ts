import * as vscode from "vscode";

export abstract class FragolaVscodeBase {
    private disposables: vscode.Disposable[] = [];

    protected addDisposable(disposable: vscode.Disposable): void {
        this.disposables.push(disposable);
    }

    public dispose(): void {
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
    }
}