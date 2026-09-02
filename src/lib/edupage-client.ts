import fs from 'fs';
import path from 'path';
import { RawEduPageResponse } from './types';

interface CacheEntry {
  data: RawEduPageResponse;
  timestamp: number;
  isFallback: boolean;
}

let memoryCache: CacheEntry | null = null;

const BASE_URL = process.env.EDUPAGE_BASE_URL || 'https://iilmgn.edupage.org';
const TIMETABLE_NUM = process.env.TIMETABLE_NUM || '37';
const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS || '3600000', 10); // default 1 hour

function getFallbackFilePath(): string {
  return path.join(process.cwd(), 'data', 'fallback-timetable.json');
}

function loadFallbackData(): RawEduPageResponse {
  const filePath = getFallbackFilePath();
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as RawEduPageResponse;
  }
  throw new Error('Fallback timetable data not found on disk.');
}

function saveCacheToDisk(data: RawEduPageResponse) {
  try {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, 'live-cache.json');
    fs.writeFileSync(filePath, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save timetable to disk cache:', err);
  }
}

function loadDiskCache(): RawEduPageResponse | null {
  try {
    const filePath = path.join(process.cwd(), 'data', 'live-cache.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as RawEduPageResponse;
    }
  } catch (err) {
    console.error('Error reading disk cache:', err);
  }
  return null;
}

export async function fetchTimetable(forceRefresh = false): Promise<{ data: RawEduPageResponse; isFallback: boolean; timestamp: number }> {
  const now = Date.now();

  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && memoryCache && (now - memoryCache.timestamp < CACHE_TTL_MS)) {
    return {
      data: memoryCache.data,
      isFallback: memoryCache.isFallback,
      timestamp: memoryCache.timestamp,
    };
  }

  try {
    // 1. Obtain anonymous session cookie from EduPage
    const getRes = await fetch(`${BASE_URL}/timetable/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!getRes.ok) {
      throw new Error(`EduPage homepage responded with status ${getRes.status}`);
    }

    const setCookies = (getRes.headers as any).getSetCookie ? (getRes.headers as any).getSetCookie() : [getRes.headers.get('set-cookie')].filter(Boolean);
    const cookieHeader = setCookies.map((c: string) => c.split(';')[0]).join('; ');

    // 2. Fetch regular timetable database
    const postRes = await fetch(`${BASE_URL}/timetable/server/regulartt.js?__func=regularttGetData`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `${BASE_URL}/timetable/`,
      },
      body: JSON.stringify({
        __args: [null, TIMETABLE_NUM],
        __gsh: '00000000',
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!postRes.ok) {
      throw new Error(`EduPage timetable endpoint responded with status ${postRes.status}`);
    }

    const json = await postRes.json();

    if (!json?.r?.dbiAccessorRes?.tables) {
      throw new Error('EduPage response did not contain expected dbiAccessorRes.tables');
    }

    // Success! Update memory and disk cache
    memoryCache = {
      data: json as RawEduPageResponse,
      timestamp: now,
      isFallback: false,
    };
    saveCacheToDisk(json as RawEduPageResponse);

    return {
      data: memoryCache.data,
      isFallback: false,
      timestamp: now,
    };
  } catch (error) {
    console.warn('EduPage live fetch failed, falling back to cached snapshot:', (error as Error).message);

    // Try disk cache first, then fallback file
    const disk = loadDiskCache();
    const fallback = disk || loadFallbackData();

    memoryCache = {
      data: fallback,
      timestamp: memoryCache ? memoryCache.timestamp : now,
      isFallback: true,
    };

    return {
      data: fallback,
      isFallback: true,
      timestamp: memoryCache.timestamp,
    };
  }
}
