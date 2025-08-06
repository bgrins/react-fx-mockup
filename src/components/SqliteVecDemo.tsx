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

  const runDemo = async () => {
    if (!isInitialized || isRunning) return;
    
    setIsRunning(true);
    setOutput([]);
    
    try {
      log('🔄 Running SQLite Vec demo...');

      // Test vec_version
      try {
        const result = await selectArray('select vec_version() as version');
        const vec_version = result[0];
        log(`✅ vec_version: ${vec_version}`);
      } catch (e) {
        log('❌ Failed to get vec_version: ' + (e as Error).message);
      }

      // Test basic vector operations
      try {
        await exec(`
          CREATE TABLE IF NOT EXISTS test_vectors(
            id INTEGER PRIMARY KEY,
            embedding BLOB
          );
        `);
        
        await exec(`
          DELETE FROM test_vectors;
        `);
        
        await exec(`
          INSERT INTO test_vectors(embedding) 
          VALUES (vec_f32('[1, 2, 3]')), (vec_f32('[4, 5, 6]'));
        `);
        
        const vectors = await selectArrays(`
          SELECT id, vec_to_json(embedding) as embedding 
          FROM test_vectors
        `);
        
        log(`✅ Created and inserted vectors: ${JSON.stringify(vectors)}`);
        
        // Test vector similarity
        const similarities = await selectArrays(`
          SELECT 
            a.id as id_a, 
            b.id as id_b,
            vec_distance_cosine(a.embedding, b.embedding) as cosine_distance
          FROM test_vectors a, test_vectors b 
          WHERE a.id < b.id
        `);
        
        log(`✅ Vector similarities: ${JSON.stringify(similarities)}`);
        
      } catch (e) {
        log('❌ Vector operations failed: ' + (e as Error).message);
      }
      
    } catch (e) {
      log('❌ Demo failed: ' + (e as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">SQLite Vec Demo</h2>
      
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
        onClick={runDemo}
        disabled={!isInitialized || isRunning}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {isRunning ? 'Running Demo...' : 'Run Demo'}
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