# Node.js printing

A utility for printing PDFs and images from Node.js and Electron.

- This repository is a continuation of artiebits' pdf-to-printer library (https://github.com/artiebits/pdf-to-printer).
- Currently available only on Windows.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Node.js printing](#nodejs-printing)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
  - [API](#api)
    - [`.print(pdf[, options]) => Promise<void>`](#printpdf-options--promisevoid)
    - [`.getPrinters() => Promise<Printer[]>`](#getprinters--promiseprinter)
    - [`.getDefaultPrinter() => Promise<Printer | null>`](#getdefaultprinter--promiseprinter--null)
  - [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

You can install the package using `npm`:

```bash
npm install --save nodejs-printer
```

Or `yarn`

```bash
yarn add nodejs-printer
```

## Basic Usage

To print a file to the default printer:

```javascript
const { print } = require("nodejs-printer");

print("assets/sample.pdf").then(console.log);
```

## API

### `.print(pdf[, options]) => Promise<void>`

A function that prints your file.

**Arguments**

1. `pdf` (`string`, required): A path to the file you want to print. An error will be thrown if the PDF is not specified or not found.
2. `options` (`Object`, optional):
   - `printer` ( `string`, optional): Sends the file to the specified printer.
   - `pages` (`string`, optional): Specifies which pages to print in the PDF document.
   - `subset` (`string`, optional): Prints odd pages only when the value is `odd`, and even pages only when it is `even`.
   - `orientation` (`string`, optional): Provides 90-degree rotation of contents (NOT the rotation of paper which must be pre-set by the choice of printer defaults).
   - `scale` (`string`, optional): Supported names are `noscale`, `shrink`, and `fit`.
   - `monochrome` (`boolean`, optional): Prints the document in black and white. The default value is `false`.
   - `side` (`string`, optional): Supported names are `duplex`, `duplexshort`, `duplexlong`, and `simplex`.
   - `bin` (`string`, optional): Select tray to print to. Number or name.
   - `paperSize` (`string`, optional): Specifies the paper size. `A2`, `A3`, `A4`, `A5`, `A6`, `letter`, `legal`, `tabloid`, `statement`, or a name selectable from your printer settings.
   - `silent` (`boolean`, optional): Silences error messages.
   - `printDialog` (`boolean`, optional): Displays the print dialog for all the files indicated on this command line.
   - `copies`(`number`, optional): Specifies how many copies will be printed.

**Returns**

`Promise<void>`: A Promise that resolves with `undefined`.

**Examples**

To print a file to the default printer, use the following code:

```javascript
const { print } = require("nodejs-printer");

print("assets/sample.pdf").then(console.log);
```

To print to a specific printer:

```javascript
const { print } = require("nodejs-printer");

const options = {
  printer: "Zebra",
};

print("assets/pdf-sample.pdf", options).then(console.log);
```

Here is an example with a few print settings. It will print pages 1, 3, and 5, and scale them so that they fit into the printable area of the paper.

```javascript
const { print } = require("nodejs-printer");

const options = {
  printer: "Zebra",
  pages: "1-3,5",
  scale: "fit",
};

print("assets/pdf-sample.pdf", options).then(console.log);
```

### `.getPrinters() => Promise<Printer[]>`

A function to get a list of available printers.

**Returns**

`Promise<Printer[]>`: a Promise that resolves with a list of available printers.

**Examples**

```javascript
const { getPrinters } = require("nodejs-printer");

getPrinters().then(console.log);
```

### `.getDefaultPrinter() => Promise<Printer | null>`

A function to get the default printer information.

**Returns**

`Promise<Printer | null>`: a Promise that resolves with the default printer information, or `null` if there is no default printer.

**Examples**

```javascript
const { getDefaultPrinter } = require("nodejs-printer");

getDefaultPrinter().then(console.log);
```

## License

[MIT](LICENSE)
