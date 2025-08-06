// SQLite Worker for OPFS support
import {default as init} from "/sqlite3.mjs";

let sqlite3;
let db;

const initSQLite = async () => {
  if (!sqlite3) {
    sqlite3 = await init();
  }
  return sqlite3;
};

const createOPFSDatabase = async (dbName) => {
  // Try multiple OPFS approaches
  try {
    // Method 1: Check if there's an opfs object
    if (sqlite3.opfs) {
      console.log('Trying sqlite3.opfs approach...');
      return new sqlite3.opfs.OpfsDb(dbName);
    }
    
    // Method 2: Try the oo1.OpfsDb constructor
    if (sqlite3.oo1?.OpfsDb) {
      console.log('Trying sqlite3.oo1.OpfsDb approach...');
      return new sqlite3.oo1.OpfsDb(dbName);
    }
    
    // Method 3: Try initializing OPFS manually 
    if (sqlite3.installOpfsSAHPoolVfs) {
      console.log('Trying manual OPFS installation...');
      await sqlite3.installOpfsSAHPoolVfs();
      return new sqlite3.oo1.DB(dbName, 'c', 'opfs-sahpool');
    }
    
    // Method 4: Check for other OPFS methods
    if (typeof sqlite3.initOpfs === 'function') {
      console.log('Trying sqlite3.initOpfs...');
      await sqlite3.initOpfs();
      return new sqlite3.oo1.DB(dbName);
    }
    
    throw new Error('No OPFS methods available');
    
  } catch (e) {
    console.log('OPFS creation failed:', e.message);
    throw e;
  }
};

self.addEventListener('message', async (event) => {
  const { type, data, id } = event.data;
  
  try {
    switch (type) {
      case 'init':
        await initSQLite();
        
        console.log('Available sqlite3 properties:', Object.keys(sqlite3));
        console.log('Available oo1 properties:', sqlite3.oo1 ? Object.keys(sqlite3.oo1) : 'no oo1');
        
        // Try to create OPFS database
        try {
          db = await createOPFSDatabase(data.dbName || '/vec-demo.db');
          
          self.postMessage({
            id,
            type: 'success',
            data: { message: 'OPFS database initialized successfully' }
          });
        } catch (e) {
          // Fall back to memory database
          console.log('Creating fallback memory database');
          db = new sqlite3.oo1.DB(':memory:');
          self.postMessage({
            id,
            type: 'fallback',
            data: { message: `OPFS failed: ${e.message}, using memory database` }
          });
        }
        break;
        
      case 'exec':
        const result = db.exec(data.sql);
        self.postMessage({
          id,
          type: 'success',
          data: { result }
        });
        break;
        
      case 'selectArray':
        const arrayResult = db.selectArray(data.sql);
        self.postMessage({
          id,
          type: 'success',
          data: { result: arrayResult }
        });
        break;
        
      case 'selectArrays':
        const arraysResult = db.selectArrays(data.sql);
        self.postMessage({
          id,
          type: 'success',
          data: { result: arraysResult }
        });
        break;
        
      case 'close':
        if (db) {
          db.close();
          db = null;
        }
        self.postMessage({
          id,
          type: 'success',
          data: { message: 'Database closed' }
        });
        break;
        
      default:
        throw new Error(`Unknown command: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      id,
      type: 'error',
      data: { error: error.message }
    });
  }
});