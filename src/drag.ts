function makeDragable(elmnt: HTMLElement) {
  // makes an element dragable, when it has the class 'dragmode'
  // FIXME: prevent dragging off screen
  const lableText = "Drag from bottom right first, then top left";

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
          border: 1px solid black;
          resize: both;
        }
        .drag-marker {
          display: none;
        }
        .dragmode>.drag-marker {
          display: block;
          width: 0;
          height: 0;
          border-right: 10px solid transparent;
          border-top: 10px solid black;
          position: absolute;
          top: 0;
          left: 0;
          cursor: move;
        }
  `;
  document.head.appendChild(styleElement);

  function addDragMarker(elmnt: HTMLElement) {
    // add top left marker
    const marker = document.createElement("div");
    marker.classList.add("drag-marker");
    marker.onmousedown = dragMouseDown;
    marker.innerText = lableText || "";
    elmnt.prepend(marker);
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
    document.onmousemove = elementDrag;
  }

  function elementDrag(e: MouseEvent) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

export { makeDragable };
