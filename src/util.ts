const assertElementById = (elementId: string): HTMLElement => {
  // assertElementById returns document.getElementById but throws error if the element is null
  const el = document.getElementById(elementId);
  if (el === null) {
    throw new Error(`Cannot find element ${elementId}.`);
  }
  return el;
};

const propOrDefault =
  (propName: string, defVal: string | null = null) =>
  // propOrDefault returns a function to get a property from an object, or return the default value if that property doesn't exist
  (obj: { [x: string]: any; hasOwnProperty: (arg0: any) => any }) =>
    obj.hasOwnProperty(propName) ? obj[propName] : defVal;

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
  var lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1) {
    // No file extension found
    return '';
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

export {
  assertElementById,
  propOrDefault,
  removeFileExtension,
  getFileExtension,
  readFileToString,
};
