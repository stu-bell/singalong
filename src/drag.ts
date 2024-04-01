function makeDragable(elmnt: HTMLElement) {
  // makes an element dragable, when it has the class 'dragmode'
  // FIXME: prevent dragging off screen

  // add a marker element in the top left
  addDragMarker(elmnt);

  // add drag styles
  const styleElement = document.createElement("style");
  styleElement.textContent = `
        .dragcontainer {
          width: 98vw;
          height: 98vh;
          top: 0vw;
          left: 1vh;
          position: absolute;
          overflow: auto;
        }
        .dragmode {
          border: 2px solid blue;
        }
        .drag-marker {
          display: none;
          cursor: se-resize;
          position: absolute;
          width: 0;
          height: 0;
        }
        .dragmode>.drag-marker {
          display: block;
        }
        .drag-marker-top {
          border-right: 10px solid transparent;
          border-top: 10px solid blue;
          top: 0;
          left: 0;
        }
        .drag-marker-tail {
          border-left: 10px solid transparent;
          border-bottom: 10px solid blue;
          bottom: 0;
          right: 0;
        }
  `;
  document.head.appendChild(styleElement);

  function addDragMarker(elmnt: HTMLElement) {
    // add top left marker
    const markerTop = document.createElement("div");
    markerTop.classList.add("drag-marker", "drag-marker-top");
    markerTop.onmousedown = dragMouseDown;
    elmnt.prepend(markerTop);
    const markerTail = document.createElement("div");
    markerTail.classList.add("drag-marker", "drag-marker-tail");
    markerTail.onmousedown = dragMouseDown;
    elmnt.append(markerTail);
  }

  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;

  function dragMouseDown(e: MouseEvent) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    if ((e.target as HTMLElement)?.className.includes("drag-marker-top")) {
      document.onmousemove = elementDragTop;
    } else if (
      (e.target as HTMLElement)?.className.includes("drag-marker-tail")
    ) {
      document.onmousemove = elementDragTail;
    }
  }

  function elementDragTop(e: MouseEvent) {
    // drag the top left corner
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
    elmnt.style.height = elmnt.offsetHeight + pos2 + "px";
    elmnt.style.width = elmnt.offsetWidth + pos1 + "px";
  }

  function elementDragTail(e: MouseEvent) {
    // drag bottom right corner
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.height = elmnt.offsetHeight - pos2 + "px";
    elmnt.style.width = elmnt.offsetWidth - pos1 + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

export { makeDragable };
