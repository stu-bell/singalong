import { assertElementById } from './util';
import { theme } from './theme';

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
    /* slow down the transition duration to troubleshoot */
    style.innerHTML = `
        #lyricsContainer li {
          transition: 0.2s linear all;
          margin: 0 10px;
        }
        #lyricsContainer li,
        #setupSample {
            font-family: ${theme.fontFamily};
            font-weight: ${theme.fontWeight};
            color: ${theme.previewTextColor};
            paint-order: stroke fill;
            -webkit-text-stroke: ${theme.previewScale * textSize * theme.outlineRatio}px ${theme.outlineColor};
            font-size: ${theme.previewScale * textSize}px !important;
            width: ${theme.previewScale * 100}% !important;
            opacity: 1;
        }
        /* the screen setup sample (SCR-13) looks like the current line */
        #lyricsContainer li.large,
        #setupSample {
            color: ${theme.textColor};
            font-size: ${textSize}px !important;
            -webkit-text-stroke-width: ${textSize * theme.outlineRatio}px;
            width: 100% !important;
            opacity: 1;
        }
        /* lines after a break, hidden during intros and instrumentals (LYR-13). They keep their space, so nothing
           jumps when they fade in. */
        #lyricsContainer li.preview-hidden {
            opacity: 0;
        }
        #lyricsContainer li.zero {
          font-size: 0px !important;
          width: 0% !important;
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
