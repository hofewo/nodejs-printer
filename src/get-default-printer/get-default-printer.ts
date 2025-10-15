import execFileAsync from "../utils/exec-file-async";
import throwIfUnsupportedOperatingSystem from "../utils/throw-if-unsupported-os";
import isValidPrinter from "../utils/windows-printer-valid";
import { Printer } from "..";
import os from "os";

async function getDefaultPrinter(): Promise<Printer | null> {
  try {
    throwIfUnsupportedOperatingSystem();
    const platform = os.platform();

    if (platform === "darwin") {
      // macOS default printer: `lpstat -d` outputs like: "system default destination: <name>"
      const { stdout } = await execFileAsync("lpstat", ["-d"]);
      const match = stdout.match(/:\s*(.+)$/m);
      const name = match ? match[1].trim() : null;
      if (!name) return null;
      // Try to fetch paper sizes similar to list function
      let paperSizes: string[] = [];
      try {
        const { stdout: opts } = await execFileAsync("lpoptions", [
          "-p",
          name,
          "-l",
        ]);
        paperSizes = parsePaperSizesFromLpoptions(opts);
      } catch (e) {
        paperSizes = [];
      }
      return { deviceId: name, name, paperSizes } as Printer;
    }

    const { stdout } = await execFileAsync("Powershell.exe", [
      "-Command",
      `Get-CimInstance Win32_Printer -Property DeviceID,Name,PrinterPaperNames -Filter Default=true`,
    ]);

    const printer = stdout.trim();

    // If stdout is empty, there is no default printer
    if (!stdout) return null;

    const { isValid, printerData } = isValidPrinter(printer);

    // DeviceID or Name not found
    if (!isValid) return null;

    return printerData;
  } catch (error) {
    throw error;
  }
}

function parsePaperSizesFromLpoptions(output: string): string[] {
  const sizes: string[] = [];
  const lines = output.split(/\r?\n/);
  const line =
    lines.find((l) => /^PageSize\b/.test(l)) ||
    lines.find((l) => /^media\b/i.test(l));
  if (!line) return sizes;

  const idx = line.indexOf(":");
  if (idx === -1) return sizes;
  const tokens = line
    .slice(idx + 1)
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/^\*/, ""));

  tokens.forEach((tok) => {
    if (!tok) return;
    const normalized = tok.replace(/_/g, " ");
    sizes.push(normalized);
  });
  return sizes;
}

export default getDefaultPrinter;
