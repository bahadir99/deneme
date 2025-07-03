window.addEventListener("DOMContentLoaded", () => {
  const exitModal = document.getElementById("exit-modal");
  const exitYesBtn = document.getElementById("exit-yes-btn");
  const exitNoBtn = document.getElementById("exit-no-btn");

  if (document.getElementById("exit-btn")) {
    document.getElementById("exit-btn").addEventListener("click", () => {
      exitModal.style.display = "flex";
    });
  }

  if (exitYesBtn) {
    exitYesBtn.addEventListener("click", () => {
      window.__TAURI__.core.invoke('exit_app');
    });
  }

  if (exitNoBtn) {
    exitNoBtn.addEventListener("click", () => {
      exitModal.style.display = "none";
    });
  }

  const createStoryBtn = document.getElementById("create-story-btn");
  if (createStoryBtn) {
    createStoryBtn.addEventListener("click", () => {
      window.location.href = "create-story.html";
    });
  }

  const blocksCanvas = document.getElementById("blocks-canvas");
  const addBlockBtn = document.getElementById("add-block-btn");
  const cancelStoryBtn = document.getElementById("cancel-story-btn");
  const connectionsSvg = document.getElementById("connections-svg");

  if (blocksCanvas && addBlockBtn && cancelStoryBtn && connectionsSvg) {
    let blocks = [];
    let dragInfo = null;
    let selectedBlock = null; // index of selected block for sidebar
    let connectDrag = null; // { blockIdx, selIdx, startX, startY, color }
    const sidebar = document.getElementById("sidebar");

    // Color palette for selections
    const selectionColors = [
      '#396cd8', '#e67e22', '#27ae60', '#e74c3c', '#8e44ad', '#16a085', '#f39c12', '#2c3e50', '#d35400', '#7f8c8d'
    ];

    function renderBlocks() {
      blocksCanvas.querySelectorAll('.story-block').forEach(el => el.remove());
      blocks.forEach((block, blockIdx) => {
        const blockDiv = document.createElement("div");
        blockDiv.className = "story-block";
        blockDiv.style.left = block.x + "px";
        blockDiv.style.top = block.y + "px";
        blockDiv.setAttribute("data-block-idx", blockIdx);
        blockDiv.style.zIndex = dragInfo && dragInfo.idx === blockIdx ? 10 : 2;
        blockDiv.style.borderColor = (selectedBlock === blockIdx) ? '#e67e22' : '#396cd8';
        blockDiv.style.userSelect = "none";

        // Drag logic: click and hold anywhere except handle
        blockDiv.addEventListener("mousedown", (e) => {
          if (e.target.classList.contains('sel-handle')) return;
          dragInfo = {
            idx: blockIdx,
            offsetX: e.clientX - block.x,
            offsetY: e.clientY - block.y
          };
          blockDiv.style.zIndex = 10;
        });

        // Block title only (unselectable)
        if (block.title === undefined) block.title = "";
        const blockTitleDiv = document.createElement("div");
        blockTitleDiv.className = "block-title";
        blockTitleDiv.textContent = block.title || `Block ${blockIdx + 1}`;
        blockTitleDiv.style.userSelect = "none";
        // Single click: just select (no sidebar)
        blockDiv.addEventListener("click", (e) => {
          if (e.detail === 1 && !e.target.classList.contains('sel-handle')) {
            selectedBlock = blockIdx;
            renderBlocks();
          }
        });
        // Double click: open sidebar
        blockDiv.addEventListener("dblclick", (e) => {
          if (!e.target.classList.contains('sel-handle')) {
            selectedBlock = blockIdx;
            renderSidebar();
            renderBlocks();
          }
        });
        blockDiv.appendChild(blockTitleDiv);

        blocksCanvas.appendChild(blockDiv);
      });
      renderConnections();
    }

    function renderSidebar() {
      if (selectedBlock === null || blocks[selectedBlock] === undefined) {
        sidebar.innerHTML = '<div style="color:#888;">Select a block to edit</div>';
        return;
      }
      const block = blocks[selectedBlock];
      sidebar.innerHTML = '';
      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✕';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '8px';
      closeBtn.style.right = '8px';
      closeBtn.style.background = 'transparent';
      closeBtn.style.border = 'none';
      closeBtn.style.fontSize = '1.2em';
      closeBtn.style.cursor = 'pointer';
      closeBtn.title = 'Close';
      closeBtn.addEventListener('click', () => {
        selectedBlock = null;
        renderSidebar();
        renderBlocks();
      });
      sidebar.appendChild(closeBtn);
      // Title
      const titleLabel = document.createElement('label');
      titleLabel.textContent = 'Block Title:';
      sidebar.appendChild(titleLabel);
      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.value = block.title;
      titleInput.style.width = '100%';
      titleInput.style.marginBottom = '0.5em';
      titleInput.addEventListener('input', (e) => {
        block.title = e.target.value;
        renderBlocks();
      });
      sidebar.appendChild(titleInput);
      // Text
      const textLabel = document.createElement('label');
      textLabel.textContent = 'Block Text:';
      sidebar.appendChild(textLabel);
      const blockText = document.createElement('textarea');
      blockText.value = block.text || '';
      blockText.rows = 3;
      blockText.style.width = '100%';
      blockText.style.margin = '0.5em 0';
      blockText.addEventListener('input', (e) => {
        block.text = e.target.value;
      });
      sidebar.appendChild(blockText);
      // Selections
      const selLabel = document.createElement('label');
      selLabel.textContent = 'Selections:';
      sidebar.appendChild(selLabel);
      block.selections.forEach((sel, selIdx) => {
        const selDiv = document.createElement('div');
        selDiv.className = 'selection-row';
        // Drag-to-connect handle
        const handle = document.createElement('span');
        handle.className = 'sel-handle';
        handle.title = 'Drag to connect';
        handle.style.background = selectionColors[selIdx % selectionColors.length];
        handle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          const rect = handle.getBoundingClientRect();
          const canvasRect = blocksCanvas.getBoundingClientRect();
          connectDrag = {
            blockIdx: selectedBlock,
            selIdx,
            startX: rect.left + rect.width / 2 - canvasRect.left,
            startY: rect.top + rect.height / 2 - canvasRect.top,
            color: selectionColors[selIdx % selectionColors.length]
          };
          renderConnections();
        });
        selDiv.appendChild(handle);
        // Selection text
        const selInput = document.createElement('input');
        selInput.type = 'text';
        selInput.placeholder = 'Selection text';
        selInput.value = sel.text;
        selInput.addEventListener('input', (e) => {
          sel.text = e.target.value;
        });
        selDiv.appendChild(selInput);
        // Dropdown to link to another block
        const selTarget = document.createElement('select');
        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.textContent = '-- Link to block --';
        selTarget.appendChild(noneOption);
        blocks.forEach((b, idx) => {
          const opt = document.createElement('option');
          opt.value = idx;
          opt.textContent = `Block ${idx + 1}`;
          if (sel.target === idx) opt.selected = true;
          selTarget.appendChild(opt);
        });
        selTarget.value = sel.target !== null ? sel.target : '';
        selTarget.addEventListener('change', (e) => {
          sel.target = e.target.value === '' ? null : Number(e.target.value);
          renderConnections();
        });
        selDiv.appendChild(selTarget);
        selDiv.style.marginBottom = '0.5em';
        sidebar.appendChild(selDiv);
      });
      // Add Selection button
      const addSelBtn = document.createElement('button');
      addSelBtn.type = 'button';
      addSelBtn.textContent = 'Add Selection';
      addSelBtn.style.marginTop = '0.5em';
      addSelBtn.addEventListener('click', () => {
        block.selections.push({ text: '', target: null });
        renderSidebar();
        renderConnections();
      });
      sidebar.appendChild(addSelBtn);
    }

    function renderConnections(mouseX, mouseY) {
      connectionsSvg.innerHTML = "";
      blocks.forEach((block, blockIdx) => {
        const blockDiv = blocksCanvas.querySelector(`.story-block[data-block-idx='${blockIdx}']`);
        if (!blockDiv) return;
        const startX = blockDiv.offsetLeft + blockDiv.offsetWidth / 2;
        const startY = blockDiv.offsetTop + blockDiv.offsetHeight;
        block.selections.forEach((sel, selIdx) => {
          const color = selectionColors[selIdx % selectionColors.length];
          if (sel.target !== null && blocks[sel.target]) {
            const targetDiv = blocksCanvas.querySelector(`.story-block[data-block-idx='${sel.target}']`);
            if (!targetDiv) return;
            const endX = targetDiv.offsetLeft + targetDiv.offsetWidth / 2;
            const endY = targetDiv.offsetTop;
            const midY = startY + (endY - startY) / 2;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            const d = `M${startX},${startY} V${midY} H${endX} V${endY}`;
            path.setAttribute("d", d);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", color);
            path.setAttribute("stroke-width", "2");
            path.setAttribute("marker-end", "url(#arrowhead)");
            connectionsSvg.appendChild(path);
          }
          // Draw temp line if dragging from this selection
          if (connectDrag && connectDrag.blockIdx === blockIdx && connectDrag.selIdx === selIdx && mouseX !== undefined && mouseY !== undefined) {
            const midY = connectDrag.startY + (mouseY - connectDrag.startY) / 2;
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            const d = `M${connectDrag.startX},${connectDrag.startY} V${midY} H${mouseX} V${mouseY}`;
            path.setAttribute("d", d);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", connectDrag.color);
            path.setAttribute("stroke-width", "2");
            path.setAttribute("stroke-dasharray", "4,2");
            connectionsSvg.appendChild(path);
          }
        });
      });
      if (!connectionsSvg.querySelector("marker#arrowhead")) {
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", "arrowhead");
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "7");
        marker.setAttribute("refX", "10");
        marker.setAttribute("refY", "3.5");
        marker.setAttribute("orient", "auto");
        marker.setAttribute("markerUnits", "strokeWidth");
        const arrowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        arrowPath.setAttribute("d", "M0,0 L10,3.5 L0,7 Z");
        arrowPath.setAttribute("fill", "#396cd8");
        marker.appendChild(arrowPath);
        connectionsSvg.appendChild(marker);
      }
    }

    addBlockBtn.addEventListener("click", () => {
      const offset = 40 * blocks.length;
      blocks.push({ title: "", text: "", selections: [], x: 60 + offset, y: 60 + offset });
      renderBlocks();
    });

    document.addEventListener("mousemove", (e) => {
      if (dragInfo) {
        const block = blocks[dragInfo.idx];
        block.x = e.clientX - dragInfo.offsetX;
        block.y = e.clientY - dragInfo.offsetY;
        renderBlocks();
      }
      if (connectDrag) {
        const canvasRect = blocksCanvas.getBoundingClientRect();
        renderConnections(e.clientX - canvasRect.left, e.clientY - canvasRect.top);
      }
    });
    document.addEventListener("mouseup", (e) => {
      if (connectDrag) {
        const canvasRect = blocksCanvas.getBoundingClientRect();
        const mouseX = e.clientX - canvasRect.left;
        const mouseY = e.clientY - canvasRect.top;
        let foundTarget = null;
        blocks.forEach((block, idx) => {
          const blockDiv = blocksCanvas.querySelector(`.story-block[data-block-idx='${idx}']`);
          if (!blockDiv) return;
          const left = blockDiv.offsetLeft;
          const top = blockDiv.offsetTop;
          const right = left + blockDiv.offsetWidth;
          const bottom = top + blockDiv.offsetHeight;
          if (mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom) {
            foundTarget = idx;
          }
        });
        if (foundTarget !== null) {
          blocks[connectDrag.blockIdx].selections[connectDrag.selIdx].target = foundTarget;
        }
        connectDrag = null;
        renderConnections();
      }
      dragInfo = null;
    });

    renderBlocks();
    renderSidebar();

    cancelStoryBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });

    // Add Save Story button
    const saveStoryBtn = document.createElement('button');
    saveStoryBtn.id = 'save-story-btn';
    saveStoryBtn.textContent = 'Save Story';
    saveStoryBtn.style.marginTop = '0.7em';
    saveStoryBtn.style.marginRight = '0.7em';
    const mainContainer = document.querySelector('.container');
    mainContainer.insertBefore(saveStoryBtn, document.getElementById('add-block-btn'));

    saveStoryBtn.addEventListener('click', async () => {
      try {
        await window.__TAURI__.core.invoke('save_story', {
          storyJson: JSON.stringify(blocks)
        });
        alert('Story saved successfully!');
      } catch (e) {
        alert('Failed to save story: ' + e);
      }
    });
  }
});
