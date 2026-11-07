import { getFileExtension } from "./files";

type LyricLines = LyricLine[];
type LyricLine = {
  text: string,
  timestamp: number | null // number in seconds
}

const alltimestamppattern = /\[\d?\d?:?\d?\d\.?\d?\d?\d?\]/g;
function parseLrcLines(lrcFile: string) {
  // some lrc files have repeated lyrics on one line with multiple timetamps. This splits into multiple lines and sorts the result lines
  // split file by newline 
  // split on every line ending (Windows \r\n, old Mac \r, Unix \n), so blank lines behave the same whatever saved the file (LYR-2)
  const lines = lrcFile
    .split(/\r\n?|\n/)
    .filter((line: string) => line.trim() !== "");
  // only lines with a timestamp are kept below. Metadata tags such as [ar:…] never match the timestamp pattern,
  // so they are ignored, while a bare timestamp such as [00:05.00] becomes a blank line (LYR-2)
  // initialise with empty line
  let result: LyricLine[] = [{ timestamp: 0, text: "" }];
  lines.forEach((line: string) => {
    const trimmedLine = line.trim();
    const matches = trimmedLine.match(alltimestamppattern);
    if (matches && matches.length > 0) {
      // lyric is the text with the leading timestamps removed
      const lyric = trimmedLine.replace(alltimestamppattern, "").trim();
      matches.forEach((timestamp: any) => {
        result.push({
          timestamp: parseTimestampToSeconds(timestamp),
          text: lyric || " " // insert a space if the lyric is blank
        });
      });
    }
  });
  result.sort((a,b) => (a.timestamp || 0) - (b.timestamp || 0));
  return result;
}

function parseTxtLines(fileContents: string) {
  const lines = fileContents.split("\n");
  const mapped = lines.map((l: any) => ({ text: l, timestamp: null }));
  return [{ timestamp: 0, text: "" }, ...mapped] as LyricLines;
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

function formatSecondsToTimestamp(seconds:number):string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(2);
  return `${minutes}:${remainingSeconds}`
}

export { parseLyricsFile, parseTimestampToSeconds, formatSecondsToTimestamp };export type { LyricLines };

