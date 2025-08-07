import { useState, useEffect } from 'react';
import { useSqliteVec } from '~/hooks/useSqliteVec';

export function SqliteVecDemo() {
  const [isMounted, setIsMounted] = useState(false);
  const { isInitialized, isInitializing, error, exec, selectArray, selectArrays } = useSqliteVec();
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const log = (message: string) => {
    console.log(message);
    setOutput(prev => [...prev, message]);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render on server-side
  if (!isMounted) {
    return <div>Loading SQLite Vec Demo...</div>;
  }

  const loadSyntheticProfiles = async () => {
    if (!isInitialized || isRunning) return;
    
    setIsRunning(true);
    setOutput([]);
    
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
        
        // Fetch the SQL file from the public directory
        const response = await fetch('/synthetic_profiles.sql');
        if (!response.ok) {
          throw new Error(`Failed to fetch SQL file: ${response.status}`);
        }
        
        const sqlContent = await response.text();
        log('📄 SQL file loaded successfully');
        
        // Execute the entire SQL content at once
        log(`🔄 Executing SQL statements...`);
        
        try {
          // Execute the entire SQL file at once - SQLite can handle this
          await exec(sqlContent);
          log('✅ SQL executed successfully');
        } catch (error) {
          log(`❌ Bulk execution failed: ${(error as Error).message}`);
          log('⚠️ Trying to execute raw SQL content directly...');
          
          // Remove only comment-only lines, preserve SQL with inline comments
          const cleanedSQL = sqlContent
            .split('\n')
            .filter(line => {
              const trimmed = line.trim();
              return trimmed.length > 0 && !trimmed.startsWith('--');
            })
            .join('\n');
          
          try {
            await exec(cleanedSQL);
            log('✅ Raw SQL executed successfully');
          } catch (rawError) {
            log(`❌ Raw SQL execution also failed: ${(rawError as Error).message}`);
            throw rawError;
          }
        }
        
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
        
      } catch (e) {
        log('❌ Failed to load synthetic profiles: ' + (e as Error).message);
      }
      
    } catch (e) {
      log('❌ Demo failed: ' + (e as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

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
        </div>
        
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      <button 
        onClick={loadSyntheticProfiles}
        disabled={!isInitialized || isRunning}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {isRunning ? 'Loading Dataset...' : 'Load Synthetic Profiles Dataset'}
      </button>

      <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
        <h3 className="font-semibold mb-2">Output:</h3>
        {output.length === 0 ? (
          <p className="text-gray-500">No output yet. Click "Run Demo" to start.</p>
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