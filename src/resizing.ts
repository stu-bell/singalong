import { assertElementById } from './util';

const MIN_FONT_SIZE = 8;
const NORMAL_SCALE_FACTOR = 0.05; // Adjust this factor to control the scaling
const LARGE_SCALE_FACTOR = 0.1; // Adjust this factor to control the scaling

let resizeObserver: ResizeObserver | null = null;
let dragContainer: HTMLElement | null = null;

export function updateFontSizes() {
    if (!dragContainer) {
        dragContainer = assertElementById('dragcontainer');
    }
    if (!dragContainer) return;

    const containerWidth = dragContainer.clientWidth;
    const normalFontSize = Math.max(MIN_FONT_SIZE, containerWidth * NORMAL_SCALE_FACTOR);
    const largeFontSize = Math.max(MIN_FONT_SIZE, containerWidth * LARGE_SCALE_FACTOR);

    const style = document.createElement('style');
    style.innerHTML = `
        li {
            font-size: ${normalFontSize}px !important;
            width: ${normalFontSize * 10}px !important;
        }
        li.large {
            font-size: ${largeFontSize}px !important;
            width: ${largeFontSize * 10}px !important;
        }
    `;
    const existingStyle = document.head.querySelector('style[data-dynamic-styles]');
    if (existingStyle) {
        document.head.removeChild(existingStyle);
    }
    style.setAttribute('data-dynamic-styles', 'true');
    document.head.appendChild(style);
}

export function initResizing() {
    dragContainer = assertElementById('dragcontainer');
    if (!dragContainer) return;

    resizeObserver = new ResizeObserver(updateFontSizes);
}

export function startObservingResizing() {
    if (resizeObserver && dragContainer) {
        resizeObserver.observe(dragContainer);
    }
}

export function stopObservingResizing() {
    if (resizeObserver && dragContainer) {
        resizeObserver.unobserve(dragContainer);
    }
}