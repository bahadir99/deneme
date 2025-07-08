window.addEventListener("DOMContentLoaded", () => {
  // THEME SWITCHING LOGIC (applies to all pages)
  function applyTheme(theme) {
    document.documentElement.classList.remove('light-mode', 'dark-mode');
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else if (theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
    }
    // If 'system', do nothing (let media query handle it)
  }

  function getSavedTheme() {
    return localStorage.getItem('theme-mode') || 'system';
  }

  function setSavedTheme(theme) {
    localStorage.setItem('theme-mode', theme);
  }

  const select = document.getElementById('theme-select');
  if (select) {
    const saved = getSavedTheme();
    select.value = saved;
    applyTheme(saved);
    select.addEventListener('change', function () {
      setSavedTheme(this.value);
      applyTheme(this.value);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (getSavedTheme() === 'system') {
        applyTheme('system');
      }
    });
  } else {
    // If selector not present, still apply theme on every page
    applyTheme(getSavedTheme());
  }
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
    console.log('Manage Stories button found');
    manageStoriesBtn.addEventListener('click', () => {
      console.log('Manage Stories button clicked');
      try {
        window.location.href = 'stories.html';
        console.log('Navigation attempted');
      } catch (error) {
        console.error('Navigation error:', error);
      }
    });
  } else {
    console.log('Manage Stories button not found');
  }

  const createStoryBtn = document.getElementById("create-story-btn");
  if (createStoryBtn) {
    createStoryBtn.addEventListener("click", () => {
      window.location.href = "create-story.html";
    });
  }

  // New sidebar + editor story creation system
  const scenesList = document.getElementById("scenes-list");
  const addSceneBtn = document.getElementById("add-scene-btn");
  const saveStoryBtn = document.getElementById("save-story-btn");
  const cancelStoryBtn = document.getElementById("cancel-story-btn");
  const storyTitleInput = document.getElementById("story-title-input");
  const editorTitle = document.getElementById("editor-title");
  const editorContent = document.getElementById("editor-content");
  const deleteSceneBtn = document.getElementById("delete-scene-btn");

  if (scenesList && addSceneBtn && saveStoryBtn && cancelStoryBtn && storyTitleInput) {
    // Hierarchical scenes: each scene can have children (sub-scenes)
    let scenes = [];
    let currentStoryTitle = null;
    let selectedScenePath = null; // Array of indices representing the path to the selected scene

    // Load story if title param is present in URL
    const params = new URLSearchParams(window.location.search);
    const loadTitle = params.get('title');
    if (loadTitle) {
      window.__TAURI__.core.invoke('load_story', { title: loadTitle })
        .then(storyJson => {
          try {
            scenes = JSON.parse(storyJson);
            currentStoryTitle = loadTitle;
            storyTitleInput.value = loadTitle;
            renderSidebar();
            renderEditor();
            alert('Loaded story: ' + loadTitle);
          } catch (e) {
            alert('Failed to parse loaded story: ' + e);
          }
        })
        .catch(e => {
          alert('Failed to load story: ' + e);
        });
    }

    // Helper: get scene by path (array of indices)
    function getSceneByPath(path) {
      let node = scenes;
      for (let i = 0; i < path.length; i++) {
        const key = path[i];
        if (Array.isArray(node)) {
          if (typeof key !== 'number' || key < 0 || key >= node.length) return null;
          node = node[key];
        } else if (typeof node === 'object' && node !== null) {
          if (!(key in node)) return null;
          node = node[key];
        } else {
          return null;
        }
        if (node === undefined || node === null) return null;
      }
      return node;
    }

    // Helper: get all scenes in tree as flat list with their paths
    function flattenScenes(scenesArr, path = []) {
      let result = [];
      if (!Array.isArray(scenesArr)) return result;
      scenesArr.forEach((scene, idx) => {
        if (!scene) return;
        const thisPath = [...path, idx];
        result.push({ scene, path: thisPath });
        if (scene.choices && Array.isArray(scene.choices)) {
          scene.choices.forEach((choice, cidx) => {
            if (choice && choice.subScene) {
              result = result.concat(flattenScenes([choice.subScene], [...thisPath, 'choices', cidx, 'subScene']));
            }
          });
        }
      });
      return result;
    }

    // Render sidebar with indentation based on flow, not parent/child
    function renderSidebar() {
      if (!Array.isArray(scenes) || scenes.length === 0) {
        scenesList.innerHTML = '<div class="empty-editor"><p>No scenes yet. Click "Add Scene" to start!</p></div>';
        return;
      }
      scenesList.innerHTML = '';

      // Compute depth for each scene by traversing from the start
      const sceneDepths = Array(scenes.length).fill(null);
      function traverse(idx, depth) {
        if (sceneDepths[idx] === null || sceneDepths[idx] > depth) {
          sceneDepths[idx] = depth;
          const scene = scenes[idx];
          if (scene && Array.isArray(scene.choices)) {
            scene.choices.forEach(choice => {
              if (typeof choice.target === 'number' && choice.target >= 0 && choice.target < scenes.length) {
                traverse(choice.target, depth + 1);
              }
            });
          }
        }
      }
      traverse(0, 0); // Assume scene 0 is the start

      // Render all scenes flat, but with indentation based on computed depth
      scenes.forEach((scene, idx) => {
        const isActive = Array.isArray(selectedScenePath) && selectedScenePath.length === 1 && selectedScenePath[0] === idx;
        const sceneItem = document.createElement('div');
        sceneItem.className = `scene-item${isActive ? ' active' : ''}`;
        sceneItem.style.paddingLeft = ((sceneDepths[idx] || 0) * 24 + 8) + 'px';
        sceneItem.setAttribute('data-scene-path', JSON.stringify([idx]));
        const sceneIcon = document.createElement('div');
        sceneIcon.className = 'scene-icon';
        const sceneTitle = document.createElement('div');
        sceneTitle.className = 'scene-title';
        sceneTitle.innerHTML = `<span class="scene-number">${idx + 1}</span>${scene.title || `Scene ${idx + 1}`}`;
        sceneItem.appendChild(sceneIcon);
        sceneItem.appendChild(sceneTitle);
        sceneItem.addEventListener('click', (e) => {
          e.stopPropagation();
          selectScene([idx]);
        });
        scenesList.appendChild(sceneItem);
      });
    }

    function selectScene(path) {
      selectedScenePath = path;
      renderSidebar();
      renderEditor();
    }

    function renderEditor() {
      if (!selectedScenePath || selectedScenePath.length !== 1) {
        editorTitle.textContent = 'Select a scene to edit';
        editorContent.innerHTML = `
          <div class="empty-editor">
            <h3>Welcome to Story Creator</h3>
            <p>Select a scene from the sidebar to start editing, or create a new scene to begin your story.</p>
          </div>
        `;
        deleteSceneBtn.style.display = 'none';
        return;
      }
      const idx = selectedScenePath[0];
      const scene = scenes[idx];
      if (!scene || typeof scene !== 'object') {
        selectedScenePath = null;
        renderSidebar();
        renderEditor();
        return;
      }
      editorTitle.textContent = `Scene ${idx + 1}${scene.title ? ': ' + scene.title : ''}`;
      deleteSceneBtn.style.display = 'block';
      // Layout: sidebar (left), preview (center), editor (right)
      editorContent.innerHTML = `
        <div style="display: flex; flex-direction: row; width: 100vw; min-height: 70vh;">
          <div id="scenes-list-sidebar" style="min-width:220px;max-width:260px;width:240px;background:var(--color-bg);border-right:1px solid var(--color-border);padding:18px 0 0 0;overflow-y:auto;">
            <!-- Sidebar will be rendered here by renderSidebar() -->
          </div>
          <div class="scene-preview" style="flex:1 1 0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px 24px 16px 24px;background:var(--color-bg-alt);min-width:320px;max-width:700px;">
            <div style="font-weight:bold;font-size:1.2em;margin-bottom:0.5em;color:var(--color-text);">${scene.title || `Scene ${idx + 1}`}</div>
            <div style="margin-bottom:1em;white-space:pre-line;max-width:600px;color:var(--color-text);">${scene.text || ''}</div>
            <div style="margin-bottom:0.5em;font-weight:600;color:var(--color-text);">Choices:</div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;" id="scene-preview-choices">
              ${(scene.choices||[]).map((choice, cidx) => {
                if (typeof choice.target === 'number' && scenes[choice.target]) {
                  // Escape HTML for safety
                  return `<button type='button' class='preview-choice-btn' data-target='${choice.target}' style='margin-bottom:0.3em;padding:0.4em 1.2em;border-radius:6px;border:1px solid var(--color-border);background:var(--color-choice-bg);color:var(--color-text);cursor:pointer;font-size:1em;'>${choice.text || '(No text)'}</button>`;
                } else {
                  return `<button type='button' disabled style='margin-bottom:0.3em;padding:0.4em 1.2em;border-radius:6px;border:1px solid var(--color-border);background:var(--color-bg);color:var(--color-muted);cursor:not-allowed;font-size:1em;'>${choice.text || '(No text)'}</button>`;
                }
              }).join('')}
            </div>
            <button id="preview-return-btn" style="margin-top:1.5em;padding:0.5em 1.5em;border-radius:6px;border:1px solid var(--color-border);background:var(--color-bg);color:var(--color-text);cursor:pointer;font-size:1em;">Return</button>
            <div style="margin-top:1em;color:var(--color-muted);font-size:0.95em;">${scene.conditions ? `Conditions: <code>${JSON.stringify(scene.conditions)}</code>` : ''}</div>
          </div>
          <div class="scene-form" style="min-width:320px;max-width:400px;flex:0 0 350px;background:var(--color-bg);padding:18px 16px 16px 16px;border-radius:8px;box-shadow:0 1px 4px #0001;">
            <div class="form-group">
              <label class="form-label">Scene Title</label>
              <input type="text" class="form-input" id="scene-title-input" value="${scene.title || ''}" placeholder="Enter scene title...">
            </div>
            <div class="form-group">
              <label class="form-label">Scene Text</label>
              <textarea class="form-textarea" id="scene-text-input" placeholder="Enter the scene text...">${scene.text || ''}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Scene Conditions <span style='font-weight:normal'>(JSON, e.g. {\"readLetter\":true,\"trait\":\"brave\"})</span></label>
              <input type="text" class="form-input" id="scene-conditions-input" value="${scene.conditions ? JSON.stringify(scene.conditions) : ''}" placeholder='{"readLetter":true}'>
            </div>
            <div class="choices-section">
              <div class="choices-title">Choices</div>
              <div id="choices-list">
                ${renderChoices(scene, idx)}
              </div>
              <button class="add-choice-btn" onclick="addChoice()">+ Add Choice</button>
            </div>
          </div>
        </div>
      `;
      // Add event listener for preview return button
      setTimeout(() => {
        const returnBtn = document.getElementById('preview-return-btn');
        if (returnBtn) {
          returnBtn.addEventListener('click', () => {
            // Return to main menu or previous page
            window.location.href = 'index.html';
          });
        }
      }, 0);
      // Add click handlers for preview choice buttons (after DOM is updated)
      setTimeout(() => {
        const previewChoices = document.getElementById('scene-preview-choices');
        if (previewChoices) {
          previewChoices.querySelectorAll('.preview-choice-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const targetIdx = parseInt(btn.getAttribute('data-target'), 10);
              if (!isNaN(targetIdx)) {
                selectScene([targetIdx]);
              }
            });
          });
        }
      }, 0);
      // Move sidebar content into the sidebar container in the new layout
      const sidebarContainer = document.getElementById('scenes-list-sidebar');
      if (sidebarContainer) {
        sidebarContainer.innerHTML = '';
        // Render the sidebar into the sidebarContainer
        // Temporarily swap scenesList to point to the sidebarContainer for rendering
        const oldScenesList = scenesList;
        window.scenesList = sidebarContainer;
        renderSidebar();
        window.scenesList = oldScenesList;
      }
      // Add event listeners
      const titleInput = document.getElementById('scene-title-input');
      const textInput = document.getElementById('scene-text-input');
      const conditionsInput = document.getElementById('scene-conditions-input');
      titleInput.addEventListener('input', (e) => {
        scene.title = e.target.value;
        // Update preview title live
        const previewTitle = editorContent.querySelector('.scene-preview > div:first-child');
        if (previewTitle) {
          previewTitle.textContent = scene.title || `Scene ${idx + 1}`;
        }
        renderSidebar();
      });
      textInput.addEventListener('input', (e) => {
        scene.text = e.target.value;
        // Update preview text live
        const previewText = editorContent.querySelector('.scene-preview > div:nth-child(2)');
        if (previewText) {
          previewText.textContent = scene.text || '';
        }
      });
      if (conditionsInput) {
        conditionsInput.addEventListener('input', (e) => {
          try {
            scene.conditions = e.target.value ? JSON.parse(e.target.value) : undefined;
            conditionsInput.classList.remove('input-error');
          } catch (err) {
            conditionsInput.classList.add('input-error');
          }
        });
      }
      // Real-time update for choice text and target
      setTimeout(() => {
        document.querySelectorAll('.choice-text').forEach(input => {
          input.addEventListener('input', (e) => {
            const sIdx = parseInt(input.getAttribute('data-scene-idx'), 10);
            const cIdx = parseInt(input.getAttribute('data-choice-idx'), 10);
            if (!isNaN(sIdx) && !isNaN(cIdx)) {
              scenes[sIdx].choices[cIdx].text = e.target.value;
              // Only update preview, do not re-render editor to avoid input reset
              const previewChoices = document.getElementById('scene-preview-choices');
              if (previewChoices && selectedScenePath && selectedScenePath[0] === sIdx) {
                // Update the preview buttons' text directly
                const btns = previewChoices.querySelectorAll('.preview-choice-btn');
                if (btns && btns[cIdx]) {
                  btns[cIdx].childNodes[0].textContent = e.target.value || '(No text)';
                }
              }
            }
          });
        });
        document.querySelectorAll('.choice-target').forEach(select => {
          select.addEventListener('change', (e) => {
            const sIdx = parseInt(select.getAttribute('data-scene-idx'), 10);
            const cIdx = parseInt(select.getAttribute('data-choice-idx'), 10);
            if (!isNaN(sIdx) && !isNaN(cIdx)) {
              scenes[sIdx].choices[cIdx].target = select.value === '' ? null : parseInt(select.value);
              // Re-render preview to reflect live change
              if (selectedScenePath && selectedScenePath[0] === sIdx) {
                renderEditor();
              }
            }
          });
        });
      }, 0);
    }

    function renderChoices(scene, sceneIdx) {
      if (!scene.choices || scene.choices.length === 0) {
        return '<p style="color: #666; font-style: italic;">No choices yet. Add choices to create branching paths.</p>';
      }
      return scene.choices.map((choice, choiceIdx) => {
        // Dropdown for target scene
        return `
        <div class="choice-item">
          <input type="text" class="choice-text" placeholder="Choice text" value="${choice.text || ''}"
                 data-scene-idx="${sceneIdx}" data-choice-idx="${choiceIdx}">
          <select class="choice-target" data-scene-idx="${sceneIdx}" data-choice-idx="${choiceIdx}">
            <option value="">End story</option>
            ${scenes.map((s, idx) => `<option value="${idx}" ${choice.target === idx ? 'selected' : ''}>Scene ${idx + 1}${s.title ? ': ' + s.title : ''}</option>`).join('')}
          </select>
          <button class="btn-small btn-danger" onclick="deleteChoice(${sceneIdx}, ${choiceIdx})">×</button>
        </div>
        `;
      }).join('');
    }

    // Global functions for choice management
    window.addChoice = function() {
      if (!selectedScenePath || selectedScenePath.length !== 1) return;
      const idx = selectedScenePath[0];
      const scene = scenes[idx];
      if (!scene) return;
      if (!scene.choices) scene.choices = [];
      // Find the insertion point: after the last scene that targets this scene as a choice
      let insertAt = idx + 1;
      // Find all scenes that are direct targets from this scene's choices
      const targetIndices = (scene.choices || []).map(c => typeof c.target === 'number' ? c.target : -1).filter(i => i >= 0);
      if (targetIndices.length > 0) {
        // Insert after the last target
        insertAt = Math.max(...targetIndices) + 1;
        if (insertAt > scenes.length) insertAt = scenes.length;
      }
      const newScene = { title: '', text: '', choices: [] };
      scenes.splice(insertAt, 0, newScene);
      // Update all choice targets that are >= insertAt (increment by 1)
      scenes.forEach(s => {
        if (s.choices) {
          s.choices.forEach(choice => {
            if (typeof choice.target === 'number' && choice.target >= insertAt) {
              choice.target++;
            }
          });
        }
      });
      scene.choices.push({ text: '', target: insertAt });
      renderEditor();
      renderSidebar();
    };

    window.updateChoice = function(sceneIdx, choiceIdx, field, value) {
      const scene = scenes[sceneIdx];
      if (!scene || !scene.choices || !scene.choices[choiceIdx]) return;
      if (field === 'text') {
        scene.choices[choiceIdx].text = value;
      } else if (field === 'target') {
        scene.choices[choiceIdx].target = value === '' ? null : parseInt(value);
      }
    };

    window.deleteChoice = function(sceneIdx, choiceIdx) {
      const scene = scenes[sceneIdx];
      if (!scene || !scene.choices) return;
      scene.choices.splice(choiceIdx, 1);
      renderEditor();
      renderSidebar();
    };

    // Edit sub-scene for a choice
    window.editSubScene = function(scenePathStr, choiceIndex) {
      const path = JSON.parse(scenePathStr);
      const scene = getSceneByPath(path);
      if (!scene || !scene.choices || !scene.choices[choiceIndex] || !scene.choices[choiceIndex].subScene) return;
      selectScene([...path, 'choices', choiceIndex, 'subScene']);
    };

    // Button event handlers
    addSceneBtn.addEventListener('click', () => {
      const newScene = { title: '', text: '', choices: [] };
      scenes.push(newScene);
      selectedScenePath = [scenes.length - 1];
      renderSidebar();
      renderEditor();
    });

    deleteSceneBtn.addEventListener('click', () => {
      if (!selectedScenePath || selectedScenePath.length !== 1) return;
      if (!confirm('Delete this scene?')) return;
      const idx = selectedScenePath[0];
      scenes.splice(idx, 1);
      // Remove all choices in all scenes that point to this scene
      scenes.forEach(scene => {
        if (scene.choices) {
          scene.choices = scene.choices.filter(choice => choice.target !== idx);
          // Decrement targets above the deleted idx
          scene.choices.forEach(choice => {
            if (typeof choice.target === 'number' && choice.target > idx) {
              choice.target--;
            }
          });
        }
      });
      selectedScenePath = null;
      renderSidebar();
      renderEditor();
    });

    saveStoryBtn.addEventListener('click', async () => {
      const title = storyTitleInput.value.trim();
      if (!title) {
        alert('Please enter a story title');
        return;
      }
      if (scenes.length === 0) {
        alert('Please add at least one scene');
        return;
      }
      try {
        await window.__TAURI__.core.invoke('save_story', { title, storyJson: JSON.stringify(scenes) });
        currentStoryTitle = title;
        alert('Story saved successfully!');
      } catch (e) {
        alert('Failed to save story: ' + e);
      }
    });

    cancelStoryBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    // Initialize the interface
    renderSidebar();
    renderEditor();


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
    // Player state for conditions
    let playerState = {};
    function checkConditions(conds) {
      if (!conds) return true;
      for (const key in conds) {
        if (conds[key] !== playerState[key]) return false;
      }
      return true;
    }
    function renderPlayer() {
      storyPlayerContainer.innerHTML = '';
      if (!blocks.length) {
        storyPlayerContainer.innerHTML = '<div style="color:#c00;">No story loaded.</div>';
        return;
      }
      const block = blocks[currentIdx];
      // If this scene has conditions and they are not met, show locked message
      if (block.conditions && !checkConditions(block.conditions)) {
        storyPlayerContainer.innerHTML = '<div style="color:#c00;">This scene is locked. You do not meet the requirements.</div>';
        return;
      }
      const blockDiv = document.createElement('div');
      blockDiv.style.marginBottom = '1em';
      blockDiv.innerHTML = `<div style='font-weight:bold;font-size:1.1em;margin-bottom:0.5em;'>${block.title || 'Block ' + (currentIdx + 1)}</div><div style='margin-bottom:1em;'>${block.text || ''}</div>`;
      storyPlayerContainer.appendChild(blockDiv);
      // Apply effects (e.g. set flags/traits) if present
      if (block.effects && typeof block.effects === 'object') {
        Object.assign(playerState, block.effects);
      }
      if (block.selections && block.selections.length > 0) {
        block.selections.forEach((sel, selIdx) => {
          // Check if the target scene is available (conditions met)
          let available = true;
          if (sel.target != null && blocks[sel.target] && blocks[sel.target].conditions) {
            available = checkConditions(blocks[sel.target].conditions);
          }
          if (available) {
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
          }
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
