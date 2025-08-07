#!/usr/bin/env node
import { writeFileSync, existsSync } from "fs";
import { join } from "path";

async function convertToSqliteVec(dataset, outputDir) {
  const sqlitePath = join(outputDir, "synthetic_profiles.sql");

  if (existsSync(sqlitePath)) {
    console.log(`SQLite file already exists at ${sqlitePath}, skipping conversion.`);
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

    // Generate SQL for SQLite Vec
    let sql = `-- Synthetic Profiles Dataset for SQLite Vec
-- Generated from HuggingFace dataset: ${dataset}

CREATE TABLE IF NOT EXISTS synthetic_profiles (
  id INTEGER PRIMARY KEY,
  persona TEXT,
  visit_id INTEGER,
  visit_time TEXT,
  visit_description TEXT,
  place_id INTEGER,
  url TEXT,
  title TEXT,
  domain TEXT,
  visit_count INTEGER,
  interest TEXT,
  title_name TEXT,
  -- Could add embeddings here for vector search
  -- embedding BLOB -- for vec_f32() vectors
);

-- Clear existing data
DELETE FROM synthetic_profiles;

-- Insert data
`;

    for (const rowData of allRows) {
      const row = rowData.row;

      // Escape single quotes for SQL
      const escapeSQL = (str) => {
        if (str === null || str === undefined) return "NULL";
        return `'${String(str).replace(/'/g, "''")}'`;
      };

      sql += `INSERT INTO synthetic_profiles (
        persona, visit_id, visit_time, visit_description, place_id, url, title, 
        domain, visit_count, interest, title_name
      ) VALUES (
        ${escapeSQL(row.persona)},
        ${row.visit_id || "NULL"},
        ${escapeSQL(row.visit_time)},
        ${escapeSQL(row.visit_description)},
        ${row.place_id || "NULL"},
        ${escapeSQL(row.url)},
        ${escapeSQL(row.title)},
        ${escapeSQL(row.domain)},
        ${row.visit_count || "NULL"},
        ${escapeSQL(row.interest)},
        ${escapeSQL(row.title_name)}
      );
`;
    }

    sql += `
-- Example queries for SQLite Vec (after adding embeddings):
-- SELECT * FROM synthetic_profiles WHERE persona = 'Theo';
-- SELECT domain, COUNT(*) as visit_count FROM synthetic_profiles GROUP BY domain ORDER BY visit_count DESC LIMIT 10;
-- SELECT interest, COUNT(*) as count FROM synthetic_profiles GROUP BY interest ORDER BY count DESC;
`;

    writeFileSync(sqlitePath, sql);
    console.log(`Generated SQLite Vec file: ${sqlitePath} (${allRows.length} rows)`);
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
