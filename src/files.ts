function removeFileExtension(filename: string) {
  var lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) {
    // No file extension found
    return filename;
  } else {
    return filename.substring(0, lastDotIndex);
  }
}

function getFileExtension(filename: string) {
  // returns lower case file extension, without the dot
  var lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) {
    // No file extension found
    return "";
  } else {
    return filename.substring(lastDotIndex + 1).toLowerCase();
  }
}

const readFileToString = async (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      resolve((event.target as FileReader).result as string);
    };
    reader.onerror = (event) => {
      reject(
        "Error reading file:" + (event.target as FileReader).error?.message
      );
    };
    reader.readAsText(file);
  });

function parseTsv(fileContent: string): Object[] {
  const replaceLineEndings = fileContent.replace(/\r\n/g, '\n');
  const lines = replaceLineEndings.split("\n"); // Split file content into lines
  const headers = lines[0].split("\t").map((s:string) => s.trim()); // Get field names from first line
  const data = lines.slice(1).map((line) => {
    // For each line, after the first line
    const values = line.split("\t"); // Split the line into values
    if (values.join('') === '') {
        // ignore empty rows
        return null;
    }
    let obj = {} as any;
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });
  // filter out null objects
  return data.filter((x) => (!!x));
}

function downloadFile(content:string, fileName:string) {
    const data = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    // Add the link to the DOM (needed for Firefox)
    document.body.appendChild(link);
    // Programmatically click the link
    link.click();
    document.body.removeChild(link);
}

export { downloadFile, removeFileExtension, getFileExtension, readFileToString, parseTsv };
