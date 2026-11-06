/**
 * Biometric Daemon Supervisor
 * Keeps the biometric scanner daemon alive across disconnects, crashes, and sleep cycles.
 */
const { spawn } = require("child_process");
const path = require("path");

function startDaemon() {
  const scriptPath = path.resolve(__dirname, "scanner-daemon.js");
  console.log(`[SUPERVISOR] Launching biometric scanner daemon: ${scriptPath}`);

  const child = spawn("node", [scriptPath], {
    stdio: "inherit",
    env: process.env,
  });

  child.on("error", (err) => {
    console.error("[SUPERVISOR ERROR] Failed to spawn scanner daemon:", err);
  });

  child.on("exit", (code, signal) => {
    console.warn(`[SUPERVISOR WARNING] Scanner daemon exited (code: ${code}, signal: ${signal}). Auto-restarting in 2 seconds...`);
    setTimeout(startDaemon, 2000);
  });
}

startDaemon();

