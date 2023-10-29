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
    const matchTimestamp = s.match(/^\[\d\d?:\d\d?\.\d\d?\]/);
    let splitIndex = 0;
    if (matchTimestamp) {
      splitIndex = matchTimestamp[0].length;
    }
    return {
      timestamp: parseTimestampToSeconds(s.substring(0, splitIndex)),
      text: s.substring(splitIndex),
    };
  });
  return [{ timestamp: 0, text: "" }, ...splitLeadingTimeStamps];
}

function parseTxtLines(fileContents: string) {
  const lines = fileContents.split("\n");
  const mapped = lines.map((l: any) => ({ text: l }));
  return mapped;
}


function parseTimestampToSeconds(timestamp: string): number {
// parseTimestampToSeconds akes string of [mm:ss] and returns the number of seconds
  const clean = timestamp.replace(/[[\]]/g, "");
  const parts = clean.split(":");
  const minutes = parseInt(parts[0]);
  const seconds = parseFloat(parts[1]);
  return minutes * 60 + seconds;
}

export { parseLrcLines, parseTxtLines }