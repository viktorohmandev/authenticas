import fs from 'fs';
import path from 'path';

// In production, data is in dist/data; in development, it's in src/data
// We use process.cwd() to get the project root and then determine the correct path
const getDataDir = (): string => {
  // Check if we're running from dist/ (production) or src/ (development)
  if (__dirname.includes('dist')) {
    // Production: dist/utils -> dist/data
    return path.join(__dirname, '..', 'data');
  } else {
    // Development: src/utils -> src/data
    return path.join(__dirname, '..', 'data');
  }
};

const DATA_DIR = getDataDir();

// Ensure data directory exists
export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Get full path to a data file
export function getDataFilePath(filename: string): string {
  return path.join(DATA_DIR, filename);
}

// Read JSON file with type safety
export async function readJsonFile<T>(filename: string): Promise<T[]> {
  const filePath = getDataFilePath(filename);
  
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    const data = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Handle both array and object with data property
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed && Array.isArray(parsed.data)) {
      return parsed.data;
    }
    
    return [];
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

// Write JSON file with locking mechanism
let writeLocks: Map<string, Promise<void>> = new Map();

export async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  const filePath = getDataFilePath(filename);
  
  // Wait for any existing write to complete
  const existingLock = writeLocks.get(filename);
  if (existingLock) {
    await existingLock;
  }
  
  // Create new write promise
  const writePromise = (async () => {
    try {
      ensureDataDir();
      const jsonData = JSON.stringify(data, null, 2);
      await fs.promises.writeFile(filePath, jsonData, 'utf-8');
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
      throw error;
    } finally {
      writeLocks.delete(filename);
    }
  })();
  
  writeLocks.set(filename, writePromise);
  await writePromise;
}

// Append to JSON array file
export async function appendToJsonFile<T>(filename: string, item: T): Promise<void> {
  const data = await readJsonFile<T>(filename);
  data.push(item);
  await writeJsonFile(filename, data);
}

// Update item in JSON file
export async function updateInJsonFile<T extends { id: string }>(
  filename: string,
  id: string,
  updates: Partial<T>
): Promise<T | null> {
  const data = await readJsonFile<T>(filename);
  const index = data.findIndex(item => item.id === id);
  
  if (index === -1) {
    return null;
  }
  
  data[index] = { ...data[index], ...updates };
  await writeJsonFile(filename, data);
  return data[index];
}

// Delete item from JSON file
export async function deleteFromJsonFile<T extends { id: string }>(
  filename: string,
  id: string
): Promise<boolean> {
  const data = await readJsonFile<T>(filename);
  const initialLength = data.length;
  const filtered = data.filter(item => item.id !== id);
  
  if (filtered.length === initialLength) {
    return false;
  }
  
  await writeJsonFile(filename, filtered);
  return true;
}

// Find item by ID
export async function findById<T extends { id: string }>(
  filename: string,
  id: string
): Promise<T | null> {
  const data = await readJsonFile<T>(filename);
  return data.find(item => item.id === id) || null;
}

// Find item by custom predicate
export async function findBy<T>(
  filename: string,
  predicate: (item: T) => boolean
): Promise<T | null> {
  const data = await readJsonFile<T>(filename);
  return data.find(predicate) || null;
}

// Find all items by custom predicate
export async function findAllBy<T>(
  filename: string,
  predicate: (item: T) => boolean
): Promise<T[]> {
  const data = await readJsonFile<T>(filename);
  return data.filter(predicate);
}

// Initialize data files with empty arrays if they don't exist
export async function initializeDataFiles(): Promise<void> {
  ensureDataDir();
  
  const files = [
    'retailers.json',
    'companies.json', 
    'users.json', 
    'transactions.json', 
    'audit.json',
    'disconnect_requests.json',
    'company_retailer_links.json'
  ];
  
  for (const file of files) {
    const filePath = getDataFilePath(file);
    if (!fs.existsSync(filePath)) {
      await writeJsonFile(file, []);
    }
  }
}

