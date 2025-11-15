import { assertElementById } from './util';

const NORMAL_SCALE_FACTOR = 0.05;

let resizeObserver: ResizeObserver | null = null;
let resizeContainer: HTMLElement | null = null;

export function updateFontSizes() {
    resizeContainer = assertElementById('dragcontainer');
    if (!resizeContainer) return;

    const containerWidth = resizeContainer.clientWidth;
    const textSize = containerWidth * NORMAL_SCALE_FACTOR;

    const style = document.createElement('style');
    /*important for animation for font size and width to stay in proportion*/
    style.innerHTML = `
        li {
            font-size: ${0.5 * textSize}px !important;
            width: 50%;
        }
        li.large {
            font-size: ${textSize}px !important;
            width: 100%;
        }
        li.zero {
          font-size: 0;
          width: 0;
        }
    `;
    // update styles
    const existingStyle = document.head.querySelector('style[data-dynamic-styles]');
    if (existingStyle) {
        document.head.removeChild(existingStyle);
    }
    style.setAttribute('data-dynamic-styles', 'true');
    document.head.appendChild(style);
}

// resize observer to preview resizing functions
export function initResizing() {
    resizeContainer = assertElementById('dragcontainer');
    if (!resizeContainer) return;
    resizeObserver = new ResizeObserver(updateFontSizes);
}

export function startObservingResizing() {
    if (resizeObserver && resizeContainer) {
        resizeObserver.observe(resizeContainer);
    }
}

export function stopObservingResizing() {
    if (resizeObserver && resizeContainer) {
        resizeObserver.unobserve(resizeContainer);
    }
}
