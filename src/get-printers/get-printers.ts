import execFileAsync from "../utils/exec-file-async";
import isValidPrinter from "../utils/windows-printer-valid";
import throwIfUnsupportedOperatingSystem from "../utils/throw-if-unsupported-os";
import { Printer } from "..";

async function getPrinters(): Promise<Printer[]> {
  function stdoutHandler(stdout: string) {
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

  try {
    throwIfUnsupportedOperatingSystem();
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
    return stdoutHandler(stdout);
  } catch (error) {
    throw error;
  }
}

export default getPrinters;
