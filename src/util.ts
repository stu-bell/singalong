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

const isFullScreen = () => !!( // doesn't work if F11 is used
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement   );

const requestFullScreen = (el: HTMLElement = document.documentElement) => {
  console.log ('full screen requested on ', el)
  // will only work from a secure context, eg in a handler from a user triggered event, such as click
  if (el.requestFullscreen) {
      el.requestFullscreen();
  } else if (el.webkitRequestFullscreen) { // Safari
      el.webkitRequestFullscreen();
  } else if (el.msRequestFullscreen) { // old Edge
      el.msRequestFullscreen();
  }
}

const exitFullScreen = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

export {
  assertElementById,
  propOrDefault,
  isFullScreen,
  requestFullScreen,
  exitFullScreen
};
