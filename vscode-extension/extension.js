const vscode = require("vscode");

/**
 * FoundRuu VSCode Extension(最小構成)。
 * 各コマンドは統合ターミナルで `npx foundruu ...` を実行する。
 * CLI 本体のロジックはターミナル経由で共有し、Extension 側に複製しない。
 */

function runInTerminal(command) {
  const terminal =
    vscode.window.terminals.find((t) => t.name === "FoundRuu") ??
    vscode.window.createTerminal("FoundRuu");
  terminal.show();
  terminal.sendText(`npx foundruu ${command}`);
}

function activate(context) {
  const commands = [
    ["foundruu.doctor", () => runInTerminal("doctor")],
    ["foundruu.doctorDeep", () => runInTerminal("doctor --deep")],
    ["foundruu.workflowInstall", () => runInTerminal("workflow install")],
    ["foundruu.update", () => runInTerminal("update --diff")],
    [
      "foundruu.sessionStart",
      async () => {
        const name = await vscode.window.showInputBox({
          prompt: "セッション名(英数字・ハイフン)",
          placeHolder: "add-login-api",
          validateInput: (v) =>
            /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(v) ? undefined : "英数字で始まり、/ や空白は使えません",
        });
        if (name) runInTerminal(`session start ${name}`);
      },
    ],
  ];
  for (const [id, handler] of commands) {
    context.subscriptions.push(vscode.commands.registerCommand(id, handler));
  }
}

function deactivate() {}

module.exports = { activate, deactivate };
