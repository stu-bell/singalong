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
    // @ts-ignore
    document.fullscreenElement ||
    // @ts-ignore
    document.webkitFullscreenElement ||
    // @ts-ignore
    document.mozFullScreenElement ||
    // @ts-ignore
    document.msFullscreenElement   );

const requestFullScreen = (el: HTMLElement = document.documentElement) => {
  alert('full screen requested')
  // will only work from a secure context, eg in a handler from a user triggered event, such as click
    // @ts-ignore
  if (el.requestFullscreen) {
    // @ts-ignore
      el.requestFullscreen();
    // @ts-ignore
  } else if (el.webkitRequestFullscreen) { // Safari
    // @ts-ignore
      el.webkitRequestFullscreen();
    // @ts-ignore
  } else if (el.msRequestFullscreen) { // old Edge
    // @ts-ignore
      el.msRequestFullscreen();
  }
}

const exitFullScreen = () => {
    // @ts-ignore
  if (document.exitFullscreen) {
    // @ts-ignore
    document.exitFullscreen();
    // @ts-ignore
  } else if (document.webkitExitFullscreen) {
    // @ts-ignore
    document.webkitExitFullscreen();
    // @ts-ignore
  } else if (document.msExitFullscreen) {
    // @ts-ignore
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
