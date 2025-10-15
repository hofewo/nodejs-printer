jest.mock("os");

let os;
let throwIfUnsupportedOs;

beforeEach(() => {
  jest.resetModules();
  os = require("os");
  throwIfUnsupportedOs = require("./throw-if-unsupported-os").default;
});

it("does not throw on Windows", () => {
  os.platform.mockImplementation(() => "win32");
  expect(() => throwIfUnsupportedOs()).not.toThrowError();
});

["linux", "test"].forEach((platform) => {
  it(`throws on unsupported platform ${platform}`, () => {
    os.platform.mockImplementation(() => platform);
    expect(() => throwIfUnsupportedOs()).toThrowError(
      "Operating System not supported"
    );
  });
});

it("does not throw on macOS", () => {
  os.platform.mockImplementation(() => "darwin");
  expect(() => throwIfUnsupportedOs()).not.toThrowError();
});
