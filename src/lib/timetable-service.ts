import { fetchTimetable } from './edupage-client';
import { parseEduPageResponse, ParsedTimetable } from './edupage-parser';

let cachedParsedTimetable: ParsedTimetable | null = null;
let lastParseTimestamp = 0;

export async function getTimetableService(forceRefresh = false): Promise<ParsedTimetable> {
  const { data, isFallback, timestamp } = await fetchTimetable(forceRefresh);

  if (!cachedParsedTimetable || forceRefresh || timestamp !== lastParseTimestamp) {
    cachedParsedTimetable = parseEduPageResponse(data, isFallback, timestamp);
    lastParseTimestamp = timestamp;
  }

  return cachedParsedTimetable;
}
