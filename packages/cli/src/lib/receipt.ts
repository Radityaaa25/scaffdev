import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface ReceiptFile {
  path: string;
  sha256: string;
}

export interface ReceiptModule {
  kode: string;
  version: string;
  installedAt: string;
  files: ReceiptFile[];
}

export interface ScaffReceipt {
  generator: string;
  modules: ReceiptModule[];
}

const RECEIPT_PATH = [".scaff", "receipt.json"];
const TRASH_DIR = [".scaff", "trash"];

export function receiptPath(projectDir: string): string {
  return path.join(projectDir, ...RECEIPT_PATH);
}

export function trashDir(projectDir: string): string {
  return path.join(projectDir, ...TRASH_DIR);
}

export function sha256File(absPath: string): string {
  const buf = fs.readFileSync(absPath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export function readReceipt(projectDir: string): ScaffReceipt | null {
  try {
    const raw = fs.readFileSync(receiptPath(projectDir), "utf-8");
    const parsed = JSON.parse(raw) as ScaffReceipt;
    if (!Array.isArray(parsed.modules)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeReceipt(projectDir: string, receipt: ScaffReceipt): void {
  fs.mkdirSync(path.join(projectDir, ".scaff"), { recursive: true });
  fs.writeFileSync(receiptPath(projectDir), JSON.stringify(receipt, null, 2) + "\n", "utf-8");
}

export function recordModule(
  projectDir: string,
  module: Omit<ReceiptModule, "installedAt">
): void {
  const receipt: ScaffReceipt = readReceipt(projectDir) ?? { generator: "scaffdev", modules: [] };
  receipt.modules = receipt.modules.filter((m) => m.kode !== module.kode);
  receipt.modules.push({ ...module, installedAt: new Date().toISOString() });
  writeReceipt(projectDir, receipt);
}

export function unrecordModule(projectDir: string, kode: string): void {
  const receipt = readReceipt(projectDir);
  if (!receipt) return;
  receipt.modules = receipt.modules.filter((m) => m.kode !== kode);
  writeReceipt(projectDir, receipt);
}
