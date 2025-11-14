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


export {
  assertElementById,
  propOrDefault,
};
