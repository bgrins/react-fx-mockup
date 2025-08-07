#!/usr/bin/env node
import { writeFileSync, existsSync } from "fs";
import { join } from "path";

async function convertToSqliteVec(dataset, outputDir) {
  const csvPath = join(outputDir, "synthetic_profiles.csv");

  if (existsSync(csvPath)) {
    console.log(`CSV file already exists at ${csvPath}, skipping conversion.`);
    return;
  }

  try {
    // Fetch dataset using the JSON API in batches
    const batchSize = 100; // Start smaller
    let offset = 0;
    let allRows = [];

    console.log("Fetching data from HuggingFace API...");

    while (true) {
      const viewerUrl = `https://datasets-server.huggingface.co/rows?dataset=${dataset}&config=default&split=train&offset=${offset}&length=${batchSize}`;
      console.log(`Fetching: ${viewerUrl}`);

      const response = await fetch(viewerUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NodeJS)",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(
          `Failed to fetch batch at offset ${offset}: ${response.status} ${response.statusText}`,
        );
        console.log(`Error response: ${errorText}`);
        break;
      }

      const data = await response.json();

      if (!data.rows || data.rows.length === 0) {
        console.log(`No more rows found at offset ${offset}`);
        break;
      }

      allRows.push(...data.rows);
      console.log(`Fetched ${data.rows.length} rows (total: ${allRows.length})`);

      offset += batchSize;

      // Limit to prevent too much data - adjust as needed
      if (offset >= 5000) {
        console.log(`Limiting to first ${allRows.length} rows for demo purposes`);
        break;
      }
    }

    console.log(`Total rows fetched: ${allRows.length}`);

    // Generate CSV for easier parsing
    const csvHeaders = [
      "persona",
      "visit_id",
      "visit_time",
      "visit_description",
      "place_id",
      "url",
      "title",
      "domain",
      "visit_count",
      "interest",
      "title_name",
    ];

    const escapeCSV = (str) => {
      if (str === null || str === undefined) return "";
      const stringValue = String(str);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    let csv = csvHeaders.join(",") + "\n";

    for (const rowData of allRows) {
      const row = rowData.row;

      const csvRow = [
        escapeCSV(row.persona),
        escapeCSV(row.visit_id),
        escapeCSV(row.visit_time),
        escapeCSV(row.visit_description),
        escapeCSV(row.place_id),
        escapeCSV(row.url),
        escapeCSV(row.title),
        escapeCSV(row.domain),
        escapeCSV(row.visit_count),
        escapeCSV(row.interest),
        escapeCSV(row.title_name),
      ];

      csv += csvRow.join(",") + "\n";
    }

    const csvPath = join(outputDir, "synthetic_profiles.csv");
    writeFileSync(csvPath, csv);
    console.log(`Generated CSV file: ${csvPath} (${allRows.length} rows)`);
  } catch (error) {
    console.error("Error converting to SQLite Vec format:", error);
  }
}

async function fetchSyntheticProfiles() {
  try {
    console.log("Fetching synthetic profiles dataset from HuggingFace...");

    const dataset = "zijuncheng/synthetic_profiles_ver_0";

    // Create output directory in public so it can be accessed via HTTP
    const outputDir = "./public";

    // No need to download parquet file since we're using JSON API

    // Convert to SQLite Vec format
    console.log("Converting to SQLite Vec format...");
    await convertToSqliteVec(dataset, outputDir);

    console.log("Dataset download and conversion complete!");
  } catch (error) {
    console.error("Error fetching dataset:", error);
    process.exit(1);
  }
}

// Run the script
fetchSyntheticProfiles();
