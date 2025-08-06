#!/usr/bin/env node

/**
 * Script to vendor sqlite-vec WASM files locally
 * This downloads the necessary files from the CDN and places them in the public directory
 */

import { createWriteStream, existsSync } from "fs";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PUBLIC_DIR = join(__dirname, "..", "public");
const SQLITE_VEC_VERSION = "latest"; // or specific version like '0.1.7-alpha.2'

const FILES_TO_VENDOR = [
  {
    url: `https://cdn.jsdelivr.net/npm/sqlite-vec-wasm-demo@${SQLITE_VEC_VERSION}/sqlite3.mjs`,
    dest: join(PUBLIC_DIR, "sqlite3.mjs"),
  },
  {
    url: `https://cdn.jsdelivr.net/npm/sqlite-vec-wasm-demo@${SQLITE_VEC_VERSION}/sqlite3.wasm`,
    dest: join(PUBLIC_DIR, "sqlite3.wasm"),
  },
];

async function downloadFile(url, dest) {
  console.log(`Downloading ${url} -> ${dest}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Ensure destination directory exists
    const destDir = dirname(dest);
    if (!existsSync(destDir)) {
      await mkdir(destDir, { recursive: true });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await new Promise((resolve, reject) => {
      const stream = createWriteStream(dest);
      stream.on("finish", resolve);
      stream.on("error", reject);
      stream.end(buffer);
    });

    console.log(`✅ Downloaded ${dest}`);
  } catch (error) {
    console.error(`❌ Failed to download ${url}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log("🔄 Vendoring sqlite-vec files...");

  try {
    for (const file of FILES_TO_VENDOR) {
      await downloadFile(file.url, file.dest);
    }

    console.log("✅ All sqlite-vec files vendored successfully!");
    console.log("\nFiles vendored:");
    FILES_TO_VENDOR.forEach((file) => {
      console.log(`  - ${file.dest}`);
    });
  } catch (error) {
    console.error("❌ Failed to vendor sqlite-vec files:", error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
