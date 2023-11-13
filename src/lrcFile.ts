import { getFileExtension } from "./files";

type LyricLines = LyricLine[];
type LyricLine = {
  text: string,
  timestamp: number | null
}

function sortLrcFile(lrcFile: string) {
  // some lrc files have repeated lyrics on one line with multiple timetamps. This splits into multiple lines and sorts the result lines
  // split file by newline and filter out blank lines
  const lines = lrcFile
    .split("\n")
    .filter((line: string) => line.trim() !== "");
  let result: string[] = [];
  lines.forEach((line: string) => {
    const trimmedLine = line.trim();
    const timestampPattern = /\[\d{2}:\d{2}\.\d{2}\]/g;
    const matches = trimmedLine.match(timestampPattern);
    if (matches && matches.length > 1) {
      const lyric = trimmedLine.replace(timestampPattern, "").trim();
      matches.forEach((timestamp: any) => {
        result.push(`${timestamp}${lyric}`);
      });
    } else {
      result.push(trimmedLine);
    }
  });
  result.sort();
  return result;
}

function parseLrcLines(fileContents: string) {
  const lines = sortLrcFile(fileContents);
  const removeTags = lines.filter(
    (l) => !(l.startsWith("[") && l.endsWith("]"))
  );
  const splitLeadingTimeStamps = removeTags.map((s) => {
    const matchTimestamp = s.match(/^\[\d?\d?:?\d?\d\.?\d?\d?\d?\]/);
    let splitIndex = 0;
    if (matchTimestamp) {
      splitIndex = matchTimestamp[0].length;
    }
    return {
      timestamp: parseTimestampToSeconds(s.substring(0, splitIndex)),
      text: s.substring(splitIndex),
    };
  });
  return [{ timestamp: 0, text: "" }, ...splitLeadingTimeStamps] as LyricLines;
}

// seekTimestamp returns the index of the line just before the required position
// TODO: offset next scroll from the seek position 
function seekTimestamp(lines: LyricLines, position:number) {
  return lines.findIndex(line => line.timestamp! > position) -1
}

function parseTxtLines(fileContents: string) {
  const lines = fileContents.split("\n");
  const mapped = lines.map((l: any) => ({ text: l, timestamp: null }));
  return mapped as LyricLines;
}


function parseLyricsFile(fileContent:string, file:File) {
  const ext = getFileExtension(file.name);
  const parser = (ext === 'lrc') ? parseLrcLines : parseTxtLines;
  return parser(fileContent);
}

function parseTimestampToSeconds(timestamp: string): number {
  let result:number;
// parseTimestampToSeconds akes string of [mm:ss.zzz] and returns the number of seconds
  const clean = timestamp.replace(/[[\]]/g, "");
  const parts = clean.split(":");
  if (parts.length === 1) {
    // no : so treat as only seconds
    result =  parseFloat(parts[0]);
  } else {
    const minutes = parseInt(parts[0]);
    const seconds = parseFloat(parts[1]);
    result = minutes * 60 + seconds;
  }
  return result;
}

export { parseLyricsFile, parseTimestampToSeconds };export type { LyricLines };

