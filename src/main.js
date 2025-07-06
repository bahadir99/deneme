window.addEventListener("DOMContentLoaded", () => {
  // Exit modal logic (should always run if present)
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

  // Main menu logic: handle Play a Story button
  const playStoryBtn = document.getElementById('play-story-btn');
  if (playStoryBtn) {
    playStoryBtn.addEventListener('click', () => {
      window.location.href = 'play.html';
    });
  }

  // Main menu logic: handle Manage Stories button
  const manageStoriesBtn = document.getElementById('manage-stories-btn');
  if (manageStoriesBtn) {
    manageStoriesBtn.addEventListener('click', () => {
      window.location.href = 'stories.html';
    });
    return;
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
    let currentStoryTitle = null;
    let dragInfo = null;
    let selectedBlock = null; // index of selected block for sidebar
    let connectDrag = null; // { blockIdx, selIdx, startX, startY, color }
    const sidebar = document.getElementById("sidebar");

    // Color palette for selections
    const selectionColors = [
      '#396cd8', '#e67e22', '#27ae60', '#e74c3c', '#8e44ad', '#16a085', '#f39c12', '#2c3e50', '#d35400', '#7f8c8d'
    ];

    // Load story if title param is present in URL
    const params = new URLSearchParams(window.location.search);
    const loadTitle = params.get('title');
    if (loadTitle) {
      window.__TAURI__.core.invoke('load_story', { title: loadTitle })
        .then(storyJson => {
          try {
            blocks = JSON.parse(storyJson);
            currentStoryTitle = loadTitle;
            renderBlocks();
            renderSidebar();
            alert('Loaded story: ' + loadTitle);
          } catch (e) {
            alert('Failed to parse loaded story: ' + e);
          }
        })
        .catch(e => {
          alert('Failed to load story: ' + e);
        });
    }

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
      // Delete Block button
      const deleteBlockBtn = document.createElement('button');
      deleteBlockBtn.type = 'button';
      deleteBlockBtn.textContent = 'Delete Block';
      deleteBlockBtn.style.marginTop = '0.5em';
      deleteBlockBtn.style.background = '#e74c3c';
      deleteBlockBtn.style.color = '#fff';
      deleteBlockBtn.addEventListener('click', () => {
        if (confirm('Delete this block?')) {
          blocks.splice(selectedBlock, 1);
          selectedBlock = null;
          renderSidebar();
          renderBlocks();
        }
      });
      sidebar.appendChild(deleteBlockBtn);
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
    const saveAsStoryBtn = document.createElement('button');
    saveAsStoryBtn.id = 'save-as-story-btn';
    saveAsStoryBtn.textContent = 'Save As';
    saveAsStoryBtn.style.marginTop = '0.7em';
    saveAsStoryBtn.style.marginRight = '0.7em';
    const mainContainer = document.querySelector('.container');
    mainContainer.insertBefore(saveStoryBtn, document.getElementById('add-block-btn'));
    mainContainer.insertBefore(saveAsStoryBtn, document.getElementById('add-block-btn'));

    saveStoryBtn.addEventListener('click', async () => {
      let title = currentStoryTitle;
      if (!title) {
        title = prompt('Enter a title for your story:');
        if (!title || !title.trim()) {
          alert('Story not saved: title is required.');
          return;
        }
        title = title.trim();
      }
      try {
        await window.__TAURI__.core.invoke('save_story', {
          title,
          storyJson: JSON.stringify(blocks)
        });
        currentStoryTitle = title;
        alert('Story saved successfully as "' + title + '"!');
      } catch (e) {
        alert('Failed to save story: ' + e);
      }
    });

    saveAsStoryBtn.addEventListener('click', async () => {
      const title = prompt('Enter a new title for your story:');
      if (!title || !title.trim()) {
        alert('Story not saved: title is required.');
        return;
      }
      try {
        await window.__TAURI__.core.invoke('save_story', {
          title: title.trim(),
          storyJson: JSON.stringify(blocks)
        });
        currentStoryTitle = title.trim();
        alert('Story saved as "' + title.trim() + '" successfully!');
      } catch (e) {
        alert('Failed to save story: ' + e);
      }
    });

    // Create modal for story list
    const storyModal = document.createElement('div');
    storyModal.id = 'story-modal';
    storyModal.style.display = 'none';
    storyModal.style.position = 'fixed';
    storyModal.style.top = '0';
    storyModal.style.left = '0';
    storyModal.style.width = '100vw';
    storyModal.style.height = '100vh';
    storyModal.style.background = 'rgba(0,0,0,0.4)';
    storyModal.style.justifyContent = 'center';
    storyModal.style.alignItems = 'center';
    storyModal.style.zIndex = '2000';
    storyModal.innerHTML = `
      <div id="story-modal-content" style="background:#fff;padding:2em;border-radius:10px;min-width:300px;max-width:90vw;max-height:80vh;overflow:auto;box-shadow:0 2px 10px rgba(0,0,0,0.2);position:relative;">
        <button id="close-story-modal" style="position:absolute;top:8px;right:8px;font-size:1.2em;background:transparent;border:none;cursor:pointer;">✕</button>
        <h2>Saved Stories</h2>
        <ul id="story-list" style="list-style:none;padding:0;"></ul>
      </div>
    `;
    document.body.appendChild(storyModal);

    document.getElementById('close-story-modal').addEventListener('click', () => {
      storyModal.style.display = 'none';
    });
  }

  // Stories page logic (now for stories.html)
  const storiesList = document.getElementById('stories-list');
  const createNewStoryBtn = document.getElementById('create-new-story-btn');
  const importStoryBtn = document.getElementById('import-story-btn');
  const backToMenuBtn = document.getElementById('back-to-menu-btn');
  if (storiesList && createNewStoryBtn && backToMenuBtn) {
    // Fetch and display stories
    (async () => {
      storiesList.innerHTML = '<li>Loading...</li>';
      try {
        const stories = await window.__TAURI__.core.invoke('list_stories');
        if (stories.length === 0) {
          storiesList.innerHTML = '<li style="color:#888;">No stories found.</li>';
        } else {
          storiesList.innerHTML = '';
          stories.forEach(story => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.padding = '0.4em 0';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = story;
            nameSpan.style.flex = '1';
            li.appendChild(nameSpan);
            const loadBtn = document.createElement('button');
            loadBtn.textContent = 'Load';
            loadBtn.style.marginLeft = '1em';
            loadBtn.addEventListener('click', () => {
              window.location.href = `create-story.html?title=${encodeURIComponent(story)}`;
            });
            li.appendChild(loadBtn);
            const exportBtn = document.createElement('button');
            exportBtn.textContent = 'Export';
            exportBtn.style.marginLeft = '0.5em';
            exportBtn.addEventListener('click', async () => {
              try {
                const storyJson = await window.__TAURI__.core.invoke('load_story', { title: story });
                const filePath = await window.__TAURI__.core.invoke('export_story', { title: story, storyJson: storyJson });
                alert(`Story exported successfully to: ${filePath}`);
              } catch (e) {
                alert('Failed to export story: ' + e);
              }
            });
            li.appendChild(exportBtn);
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.style.marginLeft = '0.5em';
            deleteBtn.addEventListener('click', async () => {
              if (!confirm(`Delete story '${story}'? This cannot be undone.`)) return;
              try {
                await window.__TAURI__.core.invoke('delete_story', { title: story });
                li.remove();
                alert('Deleted story: ' + story);
              } catch (e) {
                alert('Failed to delete story: ' + e);
              }
            });
            li.appendChild(deleteBtn);
            storiesList.appendChild(li);
          });
        }
      } catch (e) {
        storiesList.innerHTML = '<li style="color:#c00;">Failed to load stories.</li>';
      }
    })();
    createNewStoryBtn.addEventListener('click', () => {
      window.location.href = 'create-story.html';
    });
    
    // Import story functionality
    if (importStoryBtn) {
      // Create a hidden file input
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      
      importStoryBtn.addEventListener('click', () => {
        fileInput.click();
      });
      
      fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
          // Read the file content
          const storyJson = await file.text();
          
          // Parse the story to get the title
          const storyData = JSON.parse(storyJson);
          let storyTitle = 'Imported Story';
          
          // Try to find a title in the story data
          if (storyData.length > 0 && storyData[0].title) {
            storyTitle = storyData[0].title;
          }
          
          // Ask user for a name for the imported story
          const finalTitle = prompt('Enter a name for this story:', storyTitle);
          if (!finalTitle) return; // User cancelled
          
          // Save the imported story
          await window.__TAURI__.core.invoke('save_story', { title: finalTitle, storyJson: storyJson });
          
          alert('Story imported successfully!');
          
          // Refresh the stories list
          location.reload();
        } catch (e) {
          alert('Failed to import story: ' + e);
        }
        
        // Clear the file input
        fileInput.value = '';
      });
    }
    
    backToMenuBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
    return;
  }

  // Play page logic (for play.html)
  const playStoriesList = document.getElementById('play-stories-list');
  const playBackToMenuBtn = document.getElementById('back-to-menu-btn');
  if (playStoriesList && playBackToMenuBtn) {
    (async () => {
      playStoriesList.innerHTML = '<li>Loading...</li>';
      try {
        const stories = await window.__TAURI__.core.invoke('list_stories');
        if (stories.length === 0) {
          playStoriesList.innerHTML = '<li style="color:#888;">No stories found.</li>';
        } else {
          playStoriesList.innerHTML = '';
          stories.forEach(story => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.padding = '0.4em 0';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = story;
            nameSpan.style.flex = '1';
            li.appendChild(nameSpan);
            const playBtn = document.createElement('button');
            playBtn.textContent = 'Play';
            playBtn.style.marginLeft = '1em';
            playBtn.addEventListener('click', () => {
              window.location.href = `player.html?title=${encodeURIComponent(story)}`;
            });
            li.appendChild(playBtn);
            playStoriesList.appendChild(li);
          });
        }
      } catch (e) {
        playStoriesList.innerHTML = '<li style="color:#c00;">Failed to load stories.</li>';
      }
    })();
    playBackToMenuBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
    return;
  }

  // Player page logic (for player.html)
  const storyPlayerContainer = document.getElementById('story-player-container');
  const playerBackToMenuBtn = document.getElementById('player-back-to-menu-btn');
  if (storyPlayerContainer && playerBackToMenuBtn) {
    const params = new URLSearchParams(window.location.search);
    const playTitle = params.get('title');
    let blocks = [];
    let currentIdx = 0;
    function renderPlayer() {
      storyPlayerContainer.innerHTML = '';
      if (!blocks.length) {
        storyPlayerContainer.innerHTML = '<div style="color:#c00;">No story loaded.</div>';
        return;
      }
      const block = blocks[currentIdx];
      const blockDiv = document.createElement('div');
      blockDiv.style.marginBottom = '1em';
      blockDiv.innerHTML = `<div style='font-weight:bold;font-size:1.1em;margin-bottom:0.5em;'>${block.title || 'Block ' + (currentIdx + 1)}</div><div style='margin-bottom:1em;'>${block.text || ''}</div>`;
      storyPlayerContainer.appendChild(blockDiv);
      if (block.selections && block.selections.length > 0) {
        block.selections.forEach((sel, selIdx) => {
          const btn = document.createElement('button');
          btn.textContent = sel.text || 'Choice ' + (selIdx + 1);
          btn.style.marginRight = '0.5em';
          btn.style.marginBottom = '0.5em';
          btn.addEventListener('click', () => {
            if (sel.target != null && blocks[sel.target]) {
              currentIdx = sel.target;
              renderPlayer();
            } else {
              alert('End of story or invalid target.');
            }
          });
          storyPlayerContainer.appendChild(btn);
        });
      } else {
        const endDiv = document.createElement('div');
        endDiv.style.color = '#888';
        endDiv.style.marginTop = '1em';
        endDiv.textContent = 'End of story.';
        storyPlayerContainer.appendChild(endDiv);
      }
    }
    if (playTitle) {
      window.__TAURI__.core.invoke('load_story', { title: playTitle })
        .then(storyJson => {
          try {
            blocks = JSON.parse(storyJson);
            currentIdx = 0;
            renderPlayer();
          } catch (e) {
            storyPlayerContainer.innerHTML = '<div style="color:#c00;">Failed to parse story: ' + e + '</div>';
          }
        })
        .catch(e => {
          storyPlayerContainer.innerHTML = '<div style="color:#c00;">Failed to load story: ' + e + '</div>';
        });
    } else {
      storyPlayerContainer.innerHTML = '<div style="color:#888;">No story selected.</div>';
    }
    playerBackToMenuBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
    return;
  }
});
