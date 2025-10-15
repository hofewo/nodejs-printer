import execFileAsync from "../utils/exec-file-async";
import isValidPrinter from "../utils/windows-printer-valid";
import throwIfUnsupportedOperatingSystem from "../utils/throw-if-unsupported-os";
import { Printer } from "..";
import os from "os";

async function getPrinters(): Promise<Printer[]> {
  function stdoutHandlerWindows(stdout: string) {
    const printers: Printer[] = [];

    stdout
      .split(/(\r?\n){2,}/) // Split by double line breaks to separate each printer.
      .map((printer) => printer.trim())
      .filter((printer) => !!printer)
      .forEach((printer) => {
        const { isValid, printerData } = isValidPrinter(printer);

        if (!isValid) return;

        printers.push(printerData);
      });

    return printers;
  }

  async function listPrintersMacOS(): Promise<Printer[]> {
    // Use `lpstat -p` to list installed printers
    const { stdout } = await execFileAsync("lpstat", ["-p"]);
    const names: string[] = [];
    stdout
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        // Example: "printer My_Printer is idle.  enabled since ..."
        const match = line.match(/^printer\s+([^\s]+)\s/i);
        if (match) names.push(match[1]);
      });

    // For each printer, query paper sizes via `lpoptions -p <name> -l`
    const printers = await Promise.all(
      names.map(async (name) => {
        try {
          const { stdout: opts } = await execFileAsync("lpoptions", [
            "-p",
            name,
            "-l",
          ]);
          const paperSizes = parsePaperSizesFromLpoptions(opts);
          const printer: Printer = {
            deviceId: name,
            name,
            paperSizes,
          };
          return printer;
        } catch (e) {
          // Fallback without paper sizes
          return {
            deviceId: name,
            name,
            paperSizes: [],
          } as Printer;
        }
      })
    );

    return printers;
  }

  function parsePaperSizesFromLpoptions(output: string): string[] {
    const sizes: string[] = [];
    const lines = output.split(/\r?\n/);
    // Prefer PageSize; fall back to media
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
      // Normalize token to human-readable form
      const normalized = tok.replace(/_/g, " ");
      sizes.push(normalized);
    });
    return sizes;
  }

  try {
    throwIfUnsupportedOperatingSystem();
    const platform = os.platform();
    if (platform === "darwin") {
      return await listPrintersMacOS();
    }
    const { stdout } = await execFileAsync("Powershell.exe", [
      "-Command",
      `Get-CimInstance Win32_Printer -Property DeviceID,Name,PrinterPaperNames | ForEach-Object {
    # Create a new PSCustomObject to store the desired properties
    $printerObject = [PSCustomObject]@{
        Status                      = $_.Status
        Name                        = $_.Name
        DeviceID                    = $_.DeviceID
        PrinterPaperNames           = $_.PrinterPaperNames
        AllPrinterPaperNames  = "{" + ($_.PrinterPaperNames -join ", ") + "}"
    }
    # Convert the object to a string with a specified width
    $printerObject | Out-String -Width 32767
}
`,
    ]);
    return stdoutHandlerWindows(stdout);
  } catch (error) {
    throw error;
  }
}

export default getPrinters;
