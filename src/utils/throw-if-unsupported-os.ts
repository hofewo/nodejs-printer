import os from "os";

export default function throwIfUnsupportedOs() {
  const platform = os.platform();
  // Support Windows (win32) and macOS (darwin). Throw on any other platform.
  if (platform !== "win32" && platform !== "darwin") {
    throw "Operating System not supported";
  }
}
