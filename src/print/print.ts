import path from "path";
import fs from "fs";
import os from "os";
import execAsync from "../utils/exec-file-async";
import fixPathForAsarUnpack from "../utils/electron-util";
import throwIfUnsupportedOperatingSystem from "../utils/throw-if-unsupported-os";

export interface PrintOptions {
  printer?: string;
  pages?: string;
  subset?: string;
  orientation?: string;
  scale?: string;
  monochrome?: boolean;
  side?: string;
  bin?: string;
  paperSize?: string;
  silent?: boolean;
  printDialog?: boolean;
  sumatraPdfPath?: string;
  copies?: number;
}

const validSubsets = ["odd", "even"];
const validOrientations = ["portrait", "landscape"];
const validScales = ["noscale", "shrink", "fit"];
const validSides = ["duplex", "duplexshort", "duplexlong", "simplex"];

export default async function print(
  pdf: string,
  options: PrintOptions = {}
): Promise<void> {
  throwIfUnsupportedOperatingSystem();
  if (!pdf) throw "No PDF specified";
  if (!fs.existsSync(pdf)) throw "No such file";

  const platform = os.platform();

  // macOS implementation using CUPS `lp`
  if (platform === "darwin") {
    const {
      printer,
      pages,
      subset,
      orientation,
      scale,
      monochrome,
      side,
      bin,
      paperSize,
      printDialog,
      copies,
    } = options;

    if (printDialog) {
      throw "printDialog option is not supported on macOS";
    }

    const lpArgs: string[] = [];

    if (printer) {
      lpArgs.push("-d", printer);
    }

    if (copies && copies > 0) {
      lpArgs.push("-n", String(copies));
    }

    // Collect -o options
    const oOptions: string[] = [];

    if (pages) {
      // CUPS supports page ranges via page-ranges option
      oOptions.push(`page-ranges=${pages}`);
    }

    if (subset) {
      if (subset === "odd" || subset === "even") {
        oOptions.push(`page-set=${subset}`);
      } else {
        throw `Invalid subset provided. Valid names: ${validSubsets.join(
          ", "
        )}`;
      }
    }

    if (orientation) {
      if (validOrientations.includes(orientation)) {
        // CUPS accepts 'landscape'/'portrait' as short-hands
        oOptions.push(orientation);
      } else {
        throw `Invalid orientation provided. Valid names: ${validOrientations.join(
          ", "
        )}`;
      }
    }

    if (scale) {
      if (!validScales.includes(scale)) {
        throw `Invalid scale provided. Valid names: ${validScales.join(", ")}`;
      }
      if (scale === "fit" || scale === "shrink") {
        oOptions.push("fit-to-page");
      }
    }

    if (monochrome === true) {
      oOptions.push("ColorModel=Gray");
    } else if (monochrome === false) {
      oOptions.push("ColorModel=RGB");
    }

    if (side) {
      if (!validSides.includes(side)) {
        throw `Invalid side provided. Valid names: ${validSides.join(", ")}`;
      }
      const sidesMap: Record<string, string> = {
        duplex: "sides=two-sided-long-edge",
        duplexshort: "sides=two-sided-short-edge",
        duplexlong: "sides=two-sided-long-edge",
        simplex: "sides=one-sided",
      };
      oOptions.push(sidesMap[side]);
    }

    if (bin) {
      // Best-effort mapping; actual values depend on printer PPD
      oOptions.push(`InputSlot=${bin}`);
    }

    if (paperSize) {
      oOptions.push(`media=${paperSize}`);
    }

    // Append collected -o options
    oOptions.forEach((opt) => {
      lpArgs.push("-o", opt);
    });

    lpArgs.push(pdf);

    try {
      await execAsync("lp", lpArgs);
    } catch (error) {
      throw error;
    }
    return;
  }

  // Windows implementation using SumatraPDF
  let sumatraPdf =
    options.sumatraPdfPath || path.join(__dirname, "SumatraPDF-3.4.6-32.exe");
  if (!options.sumatraPdfPath) sumatraPdf = fixPathForAsarUnpack(sumatraPdf);

  const args: string[] = [];

  const { printer, silent, printDialog } = options;

  if (printDialog) {
    args.push("-print-dialog");
  } else {
    if (printer) {
      args.push("-print-to", printer);
    } else {
      args.push("-print-to-default");
    }
    if (silent !== false) {
      args.push("-silent");
    }
  }

  const printSettings = getPrintSettings(options);

  if (printSettings.length) {
    args.push("-print-settings", printSettings.join(","));
  }

  args.push(pdf);

  try {
    await execAsync(sumatraPdf, args);
  } catch (error) {
    throw error;
  }
}

function getPrintSettings(options: PrintOptions): string[] {
  const {
    pages,
    subset,
    orientation,
    scale,
    monochrome,
    side,
    bin,
    paperSize,
    copies,
  } = options;

  const printSettings = [];

  if (pages) {
    printSettings.push(pages);
  }

  if (subset) {
    if (validSubsets.includes(subset)) {
      printSettings.push(subset);
    } else {
      throw `Invalid subset provided. Valid names: ${validSubsets.join(", ")}`;
    }
  }

  if (orientation) {
    if (validOrientations.includes(orientation)) {
      printSettings.push(orientation);
    } else {
      throw `Invalid orientation provided. Valid names: ${validOrientations.join(
        ", "
      )}`;
    }
  }

  if (scale) {
    if (validScales.includes(scale)) {
      printSettings.push(scale);
    } else {
      throw `Invalid scale provided. Valid names: ${validScales.join(", ")}`;
    }
  }

  if (monochrome) {
    printSettings.push("monochrome");
  } else if (monochrome === false) {
    printSettings.push("color");
  }

  if (side) {
    if (validSides.includes(side)) {
      printSettings.push(side);
    } else {
      throw `Invalid side provided. Valid names: ${validSides.join(", ")}`;
    }
  }

  if (bin) {
    printSettings.push(`bin=${bin}`);
  }

  if (paperSize) {
    printSettings.push(`paper=${paperSize}`);
  }

  if (copies) {
    printSettings.push(`${copies}x`);
  }

  return printSettings;
}
