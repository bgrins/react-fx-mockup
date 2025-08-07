import { useState, useEffect } from 'react';
import { useSqliteVec } from '~/hooks/useSqliteVec';
import { parse } from 'csv/browser/esm/sync';

export function SqliteVecDemo() {
  const [isMounted, setIsMounted] = useState(false);
  const { isInitialized, isInitializing, error, exec, selectArray, selectArrays } = useSqliteVec();
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [recordCount, setRecordCount] = useState(0);

  const log = (message: string) => {
    console.log(message);
    setOutput(prev => [...prev, message]);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-check and load data when database is ready
  useEffect(() => {
    if (!isInitialized || isRunning) return;
    
    const checkAndLoadData = async () => {
      try {
        // Check if synthetic_profiles table exists and has data
        const result = await selectArray(`
          SELECT COUNT(*) as count 
          FROM synthetic_profiles
        `).catch(() => [0]); // Return 0 if table doesn't exist
        
        const count = result[0] || 0;
        setRecordCount(count);
        
        if (count === 0) {
          log('📊 No data found, auto-loading synthetic profiles...');
          await loadSyntheticProfiles(true);
        } else {
          log(`✅ Found ${count} synthetic profile records in database`);
          setIsDataLoaded(true);
        }
      } catch (e) {
        console.error('Error checking data:', e);
        // If table doesn't exist, load the data
        log('🔄 Database empty, loading synthetic profiles...');
        await loadSyntheticProfiles(true);
      }
    };
    
    checkAndLoadData();
  }, [isInitialized]);

  // Don't render on server-side
  if (!isMounted) {
    return <div>Loading SQLite Vec Demo...</div>;
  }

  const loadSyntheticProfiles = async (isAutoLoad = false) => {
    if (!isInitialized || isRunning) return;
    
    setIsRunning(true);
    if (!isAutoLoad) {
      setOutput([]);
    }
    
    try {
      log('🔄 Loading Synthetic Profiles dataset...');

      // Test vec_version first
      try {
        const result = await selectArray('select vec_version() as version');
        const vec_version = result[0];
        log(`✅ vec_version: ${vec_version}`);
      } catch (e) {
        log('❌ Failed to get vec_version: ' + (e as Error).message);
      }

      // Load the synthetic profiles data
      try {
        log('📊 Loading synthetic profiles dataset from HuggingFace...');
        
        // Fetch the CSV file from the public directory
        const response = await fetch('/synthetic_profiles.csv');
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV file: ${response.status}`);
        }
        
        const csvContent = await response.text();
        log('📄 CSV file loaded successfully');
        
        // Parse CSV using csv library
        log('🔄 Parsing CSV data...');
        const rows = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
        }) as Array<{
          persona: string;
          visit_id: string;
          visit_time: string;
          visit_description: string;
          place_id: string;
          url: string;
          title: string;
          domain: string;
          visit_count: string;
          interest: string;
          title_name: string;
        }>;
        
        log(`✅ Parsed ${rows.length} rows from CSV`);
        
        // Create table
        log('🔄 Creating synthetic_profiles table...');
        await exec(`
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
            title_name TEXT
          );
        `);
        
        // Clear existing data
        await exec('DELETE FROM synthetic_profiles;');
        log('✅ Table created and cleared');
        
        // Insert data in batches
        log('🔄 Inserting data in batches...');
        const batchSize = 100;
        
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          
          const insertValues = batch.map(row => {
            const escapeString = (str: string) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';
            const parseInt0 = (str: string) => str && str !== '' ? parseInt(str) || 'NULL' : 'NULL';
            
            return `(${escapeString(row.persona)}, ${parseInt0(row.visit_id)}, ${escapeString(row.visit_time)}, ${escapeString(row.visit_description)}, ${parseInt0(row.place_id)}, ${escapeString(row.url)}, ${escapeString(row.title)}, ${escapeString(row.domain)}, ${parseInt0(row.visit_count)}, ${escapeString(row.interest)}, ${escapeString(row.title_name)})`;
          });
          
          const batchSQL = `
            INSERT INTO synthetic_profiles (persona, visit_id, visit_time, visit_description, place_id, url, title, domain, visit_count, interest, title_name)
            VALUES ${insertValues.join(', ')};
          `;
          
          await exec(batchSQL);
          
          if (i % 500 === 0) {
            log(`📝 Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(rows.length/batchSize)}`);
          }
        }
        
        log('✅ All data inserted successfully');
        
        // Check how many records were loaded
        const countResult = await selectArray('SELECT COUNT(*) as count FROM synthetic_profiles');
        const recordCount = countResult[0];
        log(`✅ Loaded ${recordCount} synthetic profile records`);
        
        // Show some basic statistics
        const personaStats = await selectArrays(`
          SELECT persona, COUNT(*) as visit_count 
          FROM synthetic_profiles 
          GROUP BY persona 
          ORDER BY visit_count DESC 
          LIMIT 5
        `);
        log(`👤 Top personas by visits: ${JSON.stringify(personaStats)}`);
        
        const interestStats = await selectArrays(`
          SELECT interest, COUNT(*) as count 
          FROM synthetic_profiles 
          GROUP BY interest 
          ORDER BY count DESC 
          LIMIT 5
        `);
        log(`🎯 Top interests: ${JSON.stringify(interestStats)}`);
        
        const domainStats = await selectArrays(`
          SELECT domain, COUNT(*) as visits, SUM(visit_count) as total_visits 
          FROM synthetic_profiles 
          GROUP BY domain 
          ORDER BY visits DESC 
          LIMIT 5
        `);
        log(`🌐 Top domains: ${JSON.stringify(domainStats)}`);
        
        // Show some sample records
        const sampleRecords = await selectArrays(`
          SELECT persona, title_name, domain, interest, visit_time
          FROM synthetic_profiles 
          ORDER BY visit_time DESC 
          LIMIT 3
        `);
        log(`📋 Recent visits: ${JSON.stringify(sampleRecords)}`);
        
        // Mark data as loaded
        setIsDataLoaded(true);
        setRecordCount(recordCount);
        
      } catch (e) {
        log('❌ Failed to load synthetic profiles: ' + (e as Error).message);
      }
      
    } catch (e) {
      log('❌ Demo failed: ' + (e as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const runQuery = async (queryName: string, sql: string) => {
    if (!isInitialized || isRunning || !isDataLoaded) return;
    
    setIsRunning(true);
    setOutput([]);
    
    try {
      log(`🔍 Running ${queryName}...`);
      log(`SQL: ${sql}`);
      
      const results = await selectArrays(sql);
      log(`✅ Query results (${results.length} rows):`);
      log(JSON.stringify(results, null, 2));
      
    } catch (e) {
      log('❌ Query failed: ' + (e as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  const predefinedQueries = [
    {
      name: "Top 10 Domains by Visits",
      sql: `SELECT domain, COUNT(*) as visits, AVG(visit_count) as avg_visits_per_entry 
            FROM synthetic_profiles 
            GROUP BY domain 
            ORDER BY visits DESC 
            LIMIT 10`
    },
    {
      name: "Persona Activity Analysis", 
      sql: `SELECT persona, COUNT(*) as total_visits, 
                   COUNT(DISTINCT domain) as unique_domains,
                   AVG(visit_count) as avg_visit_count
            FROM synthetic_profiles 
            GROUP BY persona 
            ORDER BY total_visits DESC`
    },
    {
      name: "Interest Categories Breakdown",
      sql: `SELECT interest, COUNT(*) as profiles, 
                   COUNT(DISTINCT persona) as unique_users,
                   COUNT(DISTINCT domain) as unique_domains
            FROM synthetic_profiles 
            GROUP BY interest 
            ORDER BY profiles DESC`
    },
    {
      name: "Recent Activity (Last 10 Visits)",
      sql: `SELECT persona, title_name, domain, visit_description, visit_time, interest
            FROM synthetic_profiles 
            ORDER BY visit_time DESC 
            LIMIT 10`
    },
    {
      name: "Google Search Behavior",
      sql: `SELECT persona, title, interest, visit_time
            FROM synthetic_profiles 
            WHERE domain LIKE '%google.com%'
            ORDER BY visit_time DESC
            LIMIT 15`
    }
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">SQLite Vec Demo - Synthetic Profiles Dataset</h2>
      
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${
            isInitializing ? 'bg-yellow-500' : 
            isInitialized ? 'bg-green-500' : 
            error ? 'bg-red-500' : 'bg-gray-500'
          }`} />
          <span className="font-semibold">
            {isInitializing ? 'Initializing...' :
             isInitialized ? 'Ready' :
             error ? 'Error' : 'Not initialized'}
          </span>
          {isDataLoaded && recordCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              {recordCount.toLocaleString()} records loaded
            </span>
          )}
        </div>
        
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => loadSyntheticProfiles()}
            disabled={!isInitialized || isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Loading...' : 'Reload Dataset'}
          </button>
          
          {isDataLoaded && (
            <button 
              onClick={() => setOutput([])}
              disabled={isRunning}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Output
            </button>
          )}
        </div>
        
        {isDataLoaded && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Pre-built Analytics Queries</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {predefinedQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => runQuery(query.name, query.sql)}
                  disabled={!isInitialized || isRunning || !isDataLoaded}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-left"
                >
                  {query.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">Output:</h3>
        {output.length === 0 ? (
          <p className="text-gray-500">
            {isDataLoaded 
              ? "Ready! Click any query button above to analyze the synthetic profiles data."
              : "Loading synthetic profiles data from HuggingFace dataset..."}
          </p>
        ) : (
          <div className="space-y-1">
            {output.map((line, index) => (
              <div key={index} className="text-sm font-mono">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}