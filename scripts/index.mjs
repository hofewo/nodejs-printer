import cjs from "./bundle.js";

const ns = cjs && cjs.default ? cjs.default : cjs;

export const print = ns.print;
export const getPrinters = ns.getPrinters;
export const getDefaultPrinter = ns.getDefaultPrinter;

export default ns;
