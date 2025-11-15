function makeDragable(elmnt: HTMLElement, onExit: () => any = () => {}) {
  // makes an element dragable, when it has the class 'dragmode'
  // add a marker element in the top left and bottom right
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
        }
        .dragmode {
          border: 2px solid blue;
        }
        .drag-marker {
          display: none;
          cursor: se-resize;
          position: absolute;
          background-color: blue;
          width: 40px;
          height: 40px;
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
        .drag-exit {
          cursor: pointer;
          background-color: blue;
          justify-content: center;
          align-items: center;
          width: 30px;
          height: 30px;
          top: 0;
          right: 0;
        }
  `;
  document.head.appendChild(styleElement);

  function addDragMarker(elmnt: HTMLElement) {
    // add top left marker
    const markerTop = document.createElement("div");
    markerTop.classList.add("drag-marker", "drag-marker-top");
    markerTop.addEventListener("mousedown", dragMouseDown);
    markerTop.addEventListener("touchstart", dragMouseDown);
    elmnt.prepend(markerTop);
    // bottom right marker
    const markerTail = document.createElement("div");
    markerTop.textContent = "";
    markerTail.classList.add("drag-marker", "drag-marker-tail");
    markerTail.addEventListener("mousedown", dragMouseDown);
    markerTail.addEventListener("touchstart", dragMouseDown);
    elmnt.append(markerTail);
    // top right exit
    const exitBtn = document.createElement("div");
    exitBtn.textContent = '❌';
    exitBtn.classList.add("drag-marker", "drag-exit");
    exitBtn.onclick = onExit;
    elmnt.append(exitBtn);
  }

  let initialX = 0,
    initialY = 0,
    initialWidth = 0,
    initialHeight = 0,
    initialOffsetLeft = 0,
    initialOffsetTop = 0;

  function dragMouseDown(e: MouseEvent | TouchEvent) {
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    initialX = clientX;
    initialY = clientY;
    initialWidth = elmnt.offsetWidth;
    initialHeight = elmnt.offsetHeight;
    initialOffsetLeft = elmnt.offsetLeft;
    initialOffsetTop = elmnt.offsetTop;
    document.addEventListener("mouseup", closeDragElement);
    document.addEventListener("touchend", closeDragElement);
    if ((e.target as HTMLElement)?.className.includes("drag-marker-top")) {
      document.addEventListener("mousemove", elementDragTop);
      document.addEventListener("touchmove", elementDragTop);
    } else if (
      (e.target as HTMLElement)?.className.includes("drag-marker-tail")
    ) {
      document.addEventListener("mousemove", elementDragTail);
      document.addEventListener("touchmove", elementDragTail);
    }
  }

  function elementDragTop(e: MouseEvent | TouchEvent) {
    // drag the top left corner
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - initialX;
    const dy = clientY - initialY;

    // don't scroll off the screen
    if (clientX > 0) {
      elmnt.style.left = initialOffsetLeft + dx + "px";
      elmnt.style.width = initialWidth - dx + "px";
    }
    if (clientY > 0) {
      elmnt.style.top = initialOffsetTop + dy + "px";
      elmnt.style.height = initialHeight - dy + "px";
    }
  }

  function elementDragTail(e: MouseEvent | TouchEvent) {
    // drag bottom right corner
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const dx = clientX - initialX;
    const dy = clientY - initialY;
    // only resize if we're within the window
    if (clientX < window.innerWidth) {
      elmnt.style.width = initialWidth + dx + "px";
    }
    if (clientY < window.innerHeight) {
      elmnt.style.height = initialHeight + dy + "px";
    }
  }

  function closeDragElement() {
    document.removeEventListener("mouseup", closeDragElement);
    document.removeEventListener("mousemove", elementDragTop);
    document.removeEventListener("mousemove", elementDragTail);
    document.removeEventListener("touchend", closeDragElement);
    document.removeEventListener("touchmove", elementDragTop);
    document.removeEventListener("touchmove", elementDragTail);
  }
}

export { makeDragable };
