import { spawn } from "child_process";

export interface AgentResult {
  output: string;
  error: string;
  exitCode: number;
}

/**
 * Run a Claude Code skill command using the local `claude` CLI.
 * No API key needed — uses the user's existing Claude Code session.
 *
 * Example: runClaudeSkill("/market-analyst", "AAPL")
 */
export async function runClaudeSkill(
  skill: string,
  args: string = "",
  cwd?: string
): Promise<AgentResult> {
  const prompt = args ? `${skill} ${args}` : skill;
  const projectDir = cwd || process.env.PROJECT_DIR || process.cwd().replace(/\/dashboard$/, "");

  return new Promise((resolve) => {
    const chunks: string[] = [];
    const errors: string[] = [];

    const proc = spawn("claude", ["-p", prompt], {
      cwd: projectDir,
      env: { ...process.env, CLAUDECODE: "" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    proc.stdout.on("data", (data: Buffer) => {
      chunks.push(data.toString());
    });

    proc.stderr.on("data", (data: Buffer) => {
      errors.push(data.toString());
    });

    proc.on("close", (code) => {
      resolve({
        output: chunks.join(""),
        error: errors.join(""),
        exitCode: code ?? 1,
      });
    });

    proc.on("error", (err) => {
      resolve({
        output: "",
        error: err.message,
        exitCode: 1,
      });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      proc.kill("SIGTERM");
      resolve({
        output: chunks.join(""),
        error: "Agent timed out after 5 minutes",
        exitCode: 124,
      });
    }, 300000);
  });
}
