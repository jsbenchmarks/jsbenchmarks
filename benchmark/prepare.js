import { spawn } from "child_process";
import * as fs from "fs";
import path from "path";

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    // Construct full command string to avoid Node deprecation warning about args + shell:true
    const fullCommand = `${command} ${args.join(" ")}`;
    const proc = spawn(fullCommand, [], { cwd, stdio: "inherit", shell: true });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command '${fullCommand}' failed with code ${code}`));
    });
  });
}

export async function prepare(frameworks, skipPrepare = false) {
  if (skipPrepare) {
    console.log("Skipping framework preparation (install & build)...");
    return;
  }

  console.log("Preparing frameworks (install & build)...");
  
  for (const fw of frameworks) {
    const fwDir = path.resolve("frameworks", fw);
    console.log(`\n[${fw}] Preparing...`);
    
    try {
      console.log(`[${fw}] npm install`);
      await runCommand("npm", ["install"], fwDir);
      
      console.log(`[${fw}] npm run build`);
      await runCommand("npm", ["run", "build"], fwDir);
      const resultsDir = path.resolve("results", "public", "demos");
      const fwResultsDir = path.resolve(resultsDir, fw);
      fs.mkdirSync(resultsDir, { recursive: true });
      fs.cpSync(path.resolve(fwDir, "dist"), fwResultsDir, { recursive: true });
    } catch (e) {
      console.error(`[${fw}] Preparation failed:`, e.message);
      throw e;
    }
  }
  console.log("\nAll frameworks prepared successfully.\n");
}
