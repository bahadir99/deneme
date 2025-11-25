    // equip slot helpers are defined after DOM references

// Simple notification system
function showNotification(message, type = 'info', duration = 3000) {
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    document.body.appendChild(container);
  }
  const notif = document.createElement('div');
  notif.textContent = message;
  notif.className = 'notification-' + type;
  notif.style.background = type === 'error' ? '#f8d7da' : (type === 'success' ? '#d4edda' : '#e2e3e5');
  notif.style.color = type === 'error' ? '#721c24' : (type === 'success' ? '#155724' : '#383d41');
  notif.style.border = '1px solid ' + (type === 'error' ? '#f5c6cb' : (type === 'success' ? '#c3e6cb' : '#d6d8db'));
  notif.style.borderRadius = '6px';
  notif.style.padding = '0.7em 1.2em';
  notif.style.boxShadow = '0 2px 8px #0002';
  notif.style.fontSize = '1em';
  notif.style.opacity = '0.97';
  notif.style.transition = 'opacity 0.3s';
  container.appendChild(notif);
  setTimeout(() => {
    notif.style.opacity = '0';
    setTimeout(() => notif.remove(), 300);
  }, duration);
}
// Place this at the top of the file, outside any function
let previewSceneHistory = [];

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
  const exitNoBtn = document.getElementById('exit-no-btn');

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

  // Main menu logic: handle Stories button (previously Manage Stories)
  const storiesBtn = document.getElementById('stories-btn');
  if (storiesBtn) {
    console.log('Stories button found');
    storiesBtn.addEventListener('click', () => {
      console.log('Stories button clicked');
      // Hide welcome section, show stories section
      const welcomeSection = document.getElementById('welcome-section');
      const storiesSection = document.getElementById('stories-section');
      const mechanicsTemplateSection = document.getElementById('mechanics-template-section');
      if (welcomeSection) welcomeSection.style.display = 'none';
      if (storiesSection) storiesSection.style.display = 'block';
      if (mechanicsTemplateSection) mechanicsTemplateSection.style.display = 'none';
      // Close mechanics template editor modal if open
      closeMechanicsTemplateEditor();
      // Load stories list
      loadStoriesList();
    });
  } else {
    console.log('Stories button not found');
  }

  // Main menu logic: handle Mechanics Template button
  const mechanicsTemplateBtn = document.getElementById('mechanics-template-btn');
  if (mechanicsTemplateBtn) {
    mechanicsTemplateBtn.addEventListener('click', () => {
      // Hide other sections
      const welcomeSection = document.getElementById('welcome-section');
      const storiesSection = document.getElementById('stories-section');
      const mechanicsTemplateSection = document.getElementById('mechanics-template-section');
      if (welcomeSection) welcomeSection.style.display = 'none';
      if (storiesSection) storiesSection.style.display = 'none';
      if (mechanicsTemplateSection) mechanicsTemplateSection.style.display = 'block';
      loadMechanicsTemplateList();
    });
  }

  // Mechanics Template logic
  function getMechanicsTemplates() {
    // For now, use localStorage for persistence
    const data = localStorage.getItem('mechanicsTemplates');
    return data ? JSON.parse(data) : [];
  }
  function setMechanicsTemplates(templates) {
    localStorage.setItem('mechanicsTemplates', JSON.stringify(templates));
  }
  function loadMechanicsTemplateList() {
    const tbody = document.getElementById('mechanics-template-tbody');
    if (!tbody) return;
    const templates = getMechanicsTemplates();
    tbody.innerHTML = '';
    if (templates.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 2;
      td.style.color = '#888';
      td.style.padding = '1em';
      td.textContent = 'No mechanics templates found.';
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      templates.forEach((tpl, idx) => {
        const tr = document.createElement('tr');
        tr.style.display = 'table-row';
        // Name cell
        const nameTd = document.createElement('td');
        nameTd.textContent = tpl.name || `Template ${idx + 1}`;
        nameTd.style.padding = '0.8em';
        nameTd.style.borderBottom = '1px solid var(--color-border)';
        nameTd.style.fontWeight = '500';
        nameTd.style.width = '70%';
        // Actions cell
        const actionsTd = document.createElement('td');
        actionsTd.style.width = '30%';
        // Wrapper div for flex
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'actions-cell';
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = '';
        editBtn.style.marginRight = '0.5em';
        editBtn.style.padding = '0.4em 0.8em';
        editBtn.style.border = '1px solid var(--color-border)';
        editBtn.style.background = 'var(--color-primary)';
        editBtn.style.color = 'var(--color-text-light)';
        editBtn.style.borderRadius = '4px';
        editBtn.style.cursor = 'pointer';
        editBtn.style.fontSize = '0.9em';
        editBtn.style.transition = 'all 0.2s';
        editBtn.addEventListener('mouseover', () => {
          editBtn.style.background = 'var(--color-primary-dark)';
        });
        editBtn.addEventListener('mouseout', () => {
          editBtn.style.background = 'var(--color-primary)';
        });
        editBtn.addEventListener('click', () => {
          openMechanicsTemplateEditor(idx);
        });
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = '';
        deleteBtn.style.marginLeft = '0';
        deleteBtn.style.padding = '0.4em 0.8em';
        deleteBtn.style.border = '1px solid var(--color-border)';
        deleteBtn.style.background = 'var(--color-danger)';
        deleteBtn.style.color = 'var(--color-text-light)';
        deleteBtn.style.borderRadius = '4px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '0.9em';
        deleteBtn.style.transition = 'all 0.2s';
        deleteBtn.addEventListener('mouseover', () => {
          deleteBtn.style.background = 'var(--color-danger-dark)';
        });
        deleteBtn.addEventListener('mouseout', () => {
          deleteBtn.style.background = 'var(--color-danger)';
        });
        deleteBtn.addEventListener('click', () => {
          if (!confirm(`Delete mechanics template '${tpl.name || `Template ${idx + 1}`}'?`)) return;
          const updated = getMechanicsTemplates();
          updated.splice(idx, 1);
          setMechanicsTemplates(updated);
          loadMechanicsTemplateList();
        });
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        actionsTd.appendChild(actionsDiv);
        tr.appendChild(nameTd);
        tr.appendChild(actionsTd);
        tbody.appendChild(tr);
      });
    }
  }
  const createMechanicsTemplateBtn = document.getElementById('create-mechanics-template-btn');
  if (createMechanicsTemplateBtn) {
    createMechanicsTemplateBtn.addEventListener('click', () => {
      const name = prompt('Enter a name for the new mechanics template:');
      if (!name) return;
      const templates = getMechanicsTemplates();
      templates.push({ name });
      setMechanicsTemplates(templates);
      loadMechanicsTemplateList();
    });
  }

  // Main menu logic: handle Mechanics button
  const mechanicsBtn = document.getElementById('mechanics-btn');
  if (mechanicsBtn) {
    mechanicsBtn.addEventListener('click', () => {
      console.log('Mechanics button clicked');
      // TODO: Navigate to mechanics page
  showNotification('Mechanics feature coming soon!', 'info');
    });
  }

  // Main menu logic: handle Character Template button
  const characterTemplateBtn = document.getElementById('character-template-btn');
  if (characterTemplateBtn) {
    characterTemplateBtn.addEventListener('click', () => {
      console.log('Character Template button clicked');
      // TODO: Navigate to character template page
  showNotification('Character Template feature coming soon!', 'info');
    });
  }

  // Function to load stories list
  function loadStoriesList() {
    const storiesList = document.getElementById('stories-list');
    if (!storiesList) return;
    
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
            const nameSpan = document.createElement('span');
            nameSpan.textContent = story;
            li.appendChild(nameSpan);
            
            const loadBtn = document.createElement('button');
            loadBtn.textContent = 'Load';
            loadBtn.addEventListener('click', () => {
              window.location.href = `create-story.html?title=${encodeURIComponent(story)}`;
            });
            li.appendChild(loadBtn);
            
            const exportBtn = document.createElement('button');
            exportBtn.textContent = 'Export';
            exportBtn.addEventListener('click', async () => {
              try {
                const storyJson = await window.__TAURI__.core.invoke('load_story', { title: story });
                const filePath = await window.__TAURI__.core.invoke('export_story', { title: story, storyJson: storyJson });
                showNotification(`Story exported successfully to: ${filePath}`, 'success');
              } catch (e) {
                showNotification('Failed to export story: ' + e, 'error');
              }
            });
            li.appendChild(exportBtn);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', async () => {
              if (!confirm(`Delete story '${story}'? This cannot be undone.`)) return;
              try {
                await window.__TAURI__.core.invoke('delete_story', { title: story });
                li.remove();
                showNotification('Deleted story: ' + story, 'success');
              } catch (e) {
                showNotification('Failed to delete story: ' + e, 'error');
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
  }

  // Create New Story button
  const createNewStoryBtn = document.getElementById('create-new-story-btn');
  if (createNewStoryBtn) {
    createNewStoryBtn.addEventListener('click', () => {
      window.location.href = 'create-story.html';
    });
  }

  // Import Story button
  const importStoryBtn = document.getElementById('import-story-btn');
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
        const storyJson = await file.text();
        const storyData = JSON.parse(storyJson);
        let storyTitle = 'Imported Story';
        
        if (storyData.length > 0 && storyData[0].title) {
          storyTitle = storyData[0].title;
        }
        
        const finalTitle = prompt('Enter a name for this story:', storyTitle);
        if (!finalTitle) return;
        
        await window.__TAURI__.core.invoke('save_story', { title: finalTitle, storyJson: storyJson });
        alert('Story imported successfully!');
  showNotification('Story imported successfully!', 'success');
        
        // Refresh the stories list
        loadStoriesList();
      } catch (e) {
        alert('Failed to import story: ' + e);
  showNotification('Failed to import story: ' + e, 'error');
      }
      
      fileInput.value = '';
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
  const choiceEditorModal = document.getElementById("choice-editor-modal");
  const choiceEditorContent = document.getElementById("choice-editor-modal-content");
  const inventoryModeRadios = document.querySelectorAll('input[name="inventory-mode"]');
  const inventoryHolderList = document.getElementById('inventory-holder-list');
  const inventoryWorkspace = document.getElementById('inventory-workspace');
  const inventoryAddItemBtn = document.getElementById('inventory-add-item-btn');
  const inventoryDeleteItemBtn = document.getElementById('inventory-delete-item-btn');
  const inventoryItemList = document.getElementById('inventory-item-list');
  const inventoryItemForm = document.getElementById('inventory-item-form');
  const inventoryItemEmptyState = document.getElementById('inventory-item-empty');
  const inventoryHolderMeta = document.getElementById('inventory-holder-meta');
  const inventorySlotList = document.getElementById('inventory-slot-list');
  const inventoryModeBanner = document.getElementById('inventory-mode-banner');
  const inventoryAddItemSelect = document.getElementById('inventory-add-item-select');
  const inventoryAssignBtn = document.getElementById('inventory-assign-btn');
  const inventoryEquipSlotList = document.getElementById('inventory-equip-slot-list');
  const inventoryAddEquipSlotBtn = document.getElementById('inventory-add-equip-slot-btn');
  const inventoryEquipSlotEmptyState = document.getElementById('inventory-equip-slot-empty');
  const inventoryEquipSlotForm = document.getElementById('inventory-equip-slot-form');
  const inventoryEquipSlotNameInput = document.getElementById('inventory-equip-slot-name');
  const inventoryEquipSlotCapacityInput = document.getElementById('inventory-equip-slot-capacity');
  const inventoryEquipSlotSaveBtn = document.getElementById('inventory-equip-slot-save-btn');
  const inventoryEquipSlotCancelBtn = document.getElementById('inventory-equip-slot-cancel-btn');
  const inventoryEquipSlotDeleteBtn = document.getElementById('inventory-equip-slot-delete-btn');
  const inventoryItemFieldRefs = {
    name: document.getElementById('inventory-item-name'),
    category: document.getElementById('inventory-item-category'),
    type: document.getElementById('inventory-item-type'),
    slot: document.getElementById('inventory-item-slot'),
    rarity: document.getElementById('inventory-item-rarity'),
    description: document.getElementById('inventory-item-description'),
    condition: document.getElementById('inventory-item-condition'),
    usageCost: document.getElementById('inventory-item-usage-cost'),
    stats: document.getElementById('inventory-item-stats'),
    stackable: document.getElementById('inventory-item-stackable'),
    maxStack: document.getElementById('inventory-item-max-stack')
  };
  let renderInventorySidebar = () => {};
  let renderInventoryItemsList = () => {};
  let renderInventoryPreview = () => {};
  let renderEquipSlotsList = () => {};
  let openEquipSlotForm = () => {};
  let closeEquipSlotForm = () => {};
  let saveEquipSlot = () => {};
  let deleteEquipSlot = () => {};
  let selectedCharacterIdx = null;
  // Player data structure (similar to characters but separate)
  let playerData = { name: 'Player', traits: [], variableValues: {} };
  const charactersList = document.getElementById('characters-list');
  const charactersListEmpty = document.getElementById('characters-list-empty');
  const addCharacterBtn = document.getElementById('add-character-btn');
  const characterEditor = document.getElementById('character-editor');
  const characterNameInput = document.getElementById('character-name-input');
  const characterGenderInput = document.getElementById('character-gender-input');
  const characterBioGenderInput = document.getElementById('character-bio-gender-input');
  const characterTagsInput = document.getElementById('character-tags-input');
  const deleteCharacterBtn = document.getElementById('delete-character-btn');

  if (scenesList && addSceneBtn && saveStoryBtn && cancelStoryBtn && storyTitleInput) {
    // Hierarchical scenes: each scene can have children (sub-scenes)
    let scenes = [];
    let characters = [];
    let globalVariables = [];
    let characterVariablesTemplate = [];
    let traitMechanics = []; // Array of { trait: string, description: string, effects: [{ variable: string, formula: string }] }
    let inventoryMode = 'disabled';
    let inventoryItems = [];
    let inventoryAssignments = {};
    let inventoryEquipSlots = [];
    let selectedInventoryItemId = null;
    let selectedInventoryHolder = null;
    let inventoryEquipSlotAutoIncrement = Date.now();
    let inventoryItemAutoIncrement = Date.now();
    let currentDraggedItemId = null;

    function syncInventoryModeRadios() {
      if (!inventoryModeRadios || inventoryModeRadios.length === 0) return;
      inventoryModeRadios.forEach(radio => {
        radio.checked = radio.value === inventoryMode;
      });
    }

    function normalizeInventoryAssignments(assignments) {
      const normalized = {};
      if (assignments && typeof assignments === 'object') {
        Object.keys(assignments).forEach(key => {
          const value = assignments[key];
          if (Array.isArray(value)) {
            normalized[key] = value
              .map(entry => formatAssignmentEntry(entry))
              .filter(entry => entry.id !== null);
          }
        });
      }
      return normalized;
    }

    function getInventoryHolderKeys() {
      const keys = [];
      if (inventoryMode === 'player' || inventoryMode === 'all') {
        keys.push('player');
      }
      if (inventoryMode === 'all') {
        characters.forEach((_, idx) => {
          keys.push(`character:${idx}`);
        });
      }
      return keys;
    }

    function getInventoryHolderLabel(key) {
      if (key === 'player') return 'Player';
      if (key && key.startsWith('character:')) {
        const idx = parseInt(key.split(':')[1], 10);
        const char = characters[idx];
        return char && char.name ? char.name : `Character ${idx + 1}`;
      }
      return '';
    }

    function formatAssignmentEntry(entry) {
      if (typeof entry === 'object' && entry !== null) {
        return {
          id: typeof entry.id === 'number' ? entry.id : null,
          equipped: Boolean(entry.equipped),
          quantity: entry.quantity ? parseInt(entry.quantity, 10) || 1 : 1
        };
      }
      // Default to NOT equipped for legacy/simple entries
      return { id: typeof entry === 'number' ? entry : null, equipped: false, quantity: 1 };
    }

    function ensureInventoryAssignments() {
      if (inventoryMode === 'disabled') {
        return;
      }
      const keys = getInventoryHolderKeys();
      keys.forEach(key => {
        if (!Array.isArray(inventoryAssignments[key])) {
          inventoryAssignments[key] = [];
        } else {
          // Only format entries that need formatting (numbers), preserve object references
          // This prevents creating new arrays unnecessarily
          let needsUpdate = false;
          const updated = inventoryAssignments[key].map(entry => {
            if (typeof entry === 'object' && entry !== null) {
              return entry; // Keep existing object reference
            }
            needsUpdate = true;
            return formatAssignmentEntry(entry);
          });
          // Only replace array if we actually changed something
          if (needsUpdate) {
            inventoryAssignments[key] = updated;
          }
        }
      });
      Object.keys(inventoryAssignments).forEach(key => {
        if (!keys.includes(key)) {
          delete inventoryAssignments[key];
        }
      });
    }

    function ensureSelectedInventoryHolder() {
      if (inventoryMode === 'disabled') {
        selectedInventoryHolder = null;
        return;
      }
      const keys = getInventoryHolderKeys();
      if (!keys.length) {
        selectedInventoryHolder = null;
        return;
      }
      if (!selectedInventoryHolder || !keys.includes(selectedInventoryHolder)) {
        selectedInventoryHolder = keys[0];
      }
    }

    function setSelectedInventoryHolder(holderKey) {
      if (selectedInventoryHolder === holderKey) return;
      selectedInventoryHolder = holderKey;
      renderInventorySidebar();
      renderInventoryPreview();
      updateInventoryAddSelect();
    }

    renderInventorySidebar = function() {
      if (!inventoryHolderList) return;
      inventoryHolderList.innerHTML = '';
      if (inventoryMode === 'disabled') {
        selectedInventoryHolder = null;
        const placeholder = document.createElement('div');
        placeholder.className = 'inventory-placeholder';
        placeholder.textContent = 'Inventory disabled. Enable below to configure holders.';
        inventoryHolderList.appendChild(placeholder);
        renderInventoryPreview();
        return;
      }

      ensureInventoryAssignments();
      ensureSelectedInventoryHolder();

      const appendHolder = (label, detail, key) => {
        const card = document.createElement('div');
        card.className = 'inventory-holder-card';
        if (key === selectedInventoryHolder) {
          card.classList.add('inventory-holder-card--active');
        }
        const title = document.createElement('div');
        title.className = 'inventory-holder-label';
        title.textContent = label;
        card.appendChild(title);
        if (detail) {
          const subtitle = document.createElement('div');
          subtitle.className = 'inventory-holder-sublabel';
          subtitle.textContent = detail;
          card.appendChild(subtitle);
        }
        card.addEventListener('click', () => {
          setSelectedInventoryHolder(key);
        });
        inventoryHolderList.appendChild(card);
      };

      appendHolder('Player', 'Primary inventory', 'player');

      if (inventoryMode === 'all') {
        if (Array.isArray(characters) && characters.length > 0) {
          characters.forEach((char, idx) => {
            const name = char && char.name ? char.name : `Character ${idx + 1}`;
            appendHolder(name, 'Character inventory', `character:${idx}`);
          });
        } else {
          const placeholder = document.createElement('div');
          placeholder.className = 'inventory-placeholder';
          placeholder.textContent = 'No characters available yet.';
          inventoryHolderList.appendChild(placeholder);
        }
      }

      renderInventoryPreview();
      updateInventoryPreviewSummary();
      renderEquipSlotsList();
      updateInventoryAddSelect();
    };

    function updateInventoryAddSelect() {
      if (!inventoryAddItemSelect) return;
      const hasItems = Array.isArray(inventoryItems) && inventoryItems.length > 0;
      const holderAvailable = selectedInventoryHolder !== null && inventoryMode !== 'disabled';
      const canInteract = hasItems && holderAvailable;
      const options = [];
      if (!hasItems) {
        options.push('<option value="">No items available</option>');
      } else {
        options.push('<option value="">Select item...</option>');
        inventoryItems.forEach(item => {
          options.push(`<option value="${item.id}">${escapeHtml(item.name || `Item ${item.id}`)}</option>`);
        });
      }
      inventoryAddItemSelect.innerHTML = options.join('');
      inventoryAddItemSelect.disabled = !canInteract;
      if (inventoryAssignBtn) {
        inventoryAssignBtn.disabled = !canInteract || !inventoryAddItemSelect.value;
      }
    }

    function getDropZoneElement(target) {
      if (!inventorySlotList) return null;
      const zone = target ? target.closest('[data-slot-name]') : null;
      return zone || inventorySlotList;
    }

    function clearDropHighlights() {
      if (!inventorySlotList) return;
      inventorySlotList.classList.remove('drag-over');
      inventorySlotList.querySelectorAll('[data-slot-name]').forEach(zone => {
        zone.classList.remove('drag-over');
      });
    }

    function handleInventoryDragOver(event) {
      if (!selectedInventoryHolder || inventoryMode === 'disabled') return;
      const zone = getDropZoneElement(event.target);
      if (!zone) return;
      event.preventDefault();
      clearDropHighlights();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
      zone.classList.add('drag-over');
    }

    function handleInventoryDragLeave(event) {
      const zone = event.target && event.target.closest('[data-slot-name]');
      if (zone) {
        if (event.relatedTarget && zone.contains(event.relatedTarget)) return;
        zone.classList.remove('drag-over');
      } else if (inventorySlotList && (!event.relatedTarget || !inventorySlotList.contains(event.relatedTarget))) {
        clearDropHighlights();
      }
    }

    function handleInventoryDrop(event) {
      if (!selectedInventoryHolder || inventoryMode === 'disabled') {
        clearDropHighlights();
        return;
      }
      const data = event.dataTransfer ? event.dataTransfer.getData('text/plain') : '';
      const itemId = currentDraggedItemId !== null ? currentDraggedItemId : (data ? parseInt(data, 10) : null);
      if (itemId === null || Number.isNaN(itemId)) {
        clearDropHighlights();
        currentDraggedItemId = null;
        return;
      }
      clearDropHighlights();
      event.preventDefault();
      const zone = getDropZoneElement(event.target);
      if (!zone) {
        currentDraggedItemId = null;
        return;
      }
      const slotName = zone.dataset && zone.dataset.slotName ? zone.dataset.slotName : 'unassigned';
      const item = inventoryItems.find(it => it && it.id === itemId);
      if (!item) {
        currentDraggedItemId = null;
        return;
      }
      const added = addItemToHolder(selectedInventoryHolder, itemId, { equipped: false });
      if (!added) {
        currentDraggedItemId = null;
        return;
      }
      if (slotName !== 'unassigned' && item.slot === slotName) {
        toggleItemEquippedState(selectedInventoryHolder, itemId, slotName, true);
      }
      if (event.dataTransfer) {
        event.dataTransfer.clearData();
      }
      currentDraggedItemId = null;
    }

    function updateInventoryWorkspaceState() {
      if (!inventoryWorkspace) return;
      inventoryWorkspace.dataset.mode = inventoryMode;
      if (inventoryModeBanner) {
        if (inventoryMode === 'disabled') {
          inventoryModeBanner.style.display = '';
          inventoryModeBanner.textContent = 'Inventory is disabled. Enable it in the sidebar to manage items.';
        } else {
          inventoryModeBanner.style.display = 'none';
        }
      }
      const formDisabled = inventoryMode === 'disabled';
      if (inventoryItemForm) {
        inventoryItemForm.classList.toggle('inventory-item-form--disabled', formDisabled);
      }
      updateInventoryAddSelect();
    }

    function createEquipDisplay(item) {
      const slotName = item && item.slot ? item.slot : 'General';
      const typeLabel = item && item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Item';
      return `${typeLabel}${slotName ? ` · ${slotName}` : ''}`;
    }

    function groupItemsBySlot(itemEntries) {
      const groups = new Map();
      itemEntries.forEach((entry, originalIndex) => {
        const formatted = formatAssignmentEntry(entry);
        if (formatted.id == null) return;
        const item = inventoryItems.find(it => it && it.id === formatted.id);
        if (!item) return;
        const key = item.slot || 'unassigned';
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key).push({ item, equipped: formatted.equipped, entry: formatted, originalIndex });
      });
      return groups;
    }

    renderInventoryPreview = function() {
      if (!inventorySlotList) return;
      updateInventoryWorkspaceState();
      
      // Log the current state of assignments for debugging
      if (selectedInventoryHolder && inventoryAssignments[selectedInventoryHolder]) {
         const debugList = inventoryAssignments[selectedInventoryHolder];
         const equippedCount = debugList.filter(i => i.equipped).length;
         console.log('Render Preview: Found', debugList.length, 'items,', equippedCount, 'equipped.');
      }
      
      if (inventoryMode === 'disabled' || !selectedInventoryHolder) {
        if (inventoryHolderMeta) {
          inventoryHolderMeta.textContent = 'Inventory disabled.';
        }
        inventorySlotList.innerHTML = '';
        const placeholder = document.createElement('div');
        placeholder.className = 'inventory-placeholder';
        placeholder.textContent = 'Enable inventory to manage assigned items.';
        inventorySlotList.appendChild(placeholder);
        updateInventoryAddSelect();
        return;
      }
      ensureInventoryAssignments();
      ensureSelectedInventoryHolder();
      const label = getInventoryHolderLabel(selectedInventoryHolder);
      if (inventoryHolderMeta) {
        inventoryHolderMeta.textContent = label ? `Selected: ${label}` : 'Inventory';
      }
      inventorySlotList.innerHTML = '';
      inventorySlotList.dataset.slotName = 'unassigned';
      inventorySlotList.classList.add('inventory-drop-zone');
      // Get fresh reference to the array to ensure we read current state
      const assignedItems = inventoryAssignments[selectedInventoryHolder] || [];
      const groups = groupItemsBySlot(assignedItems);
      const slotDefinitions = inventoryEquipSlots || [];
      slotDefinitions.forEach(slot => {
        if (slot && slot.name && !groups.has(slot.name)) {
          groups.set(slot.name, []);
        }
      });
      if (!groups.has('unassigned')) {
        groups.set('unassigned', []);
      }
      const slotOrder = [...slotDefinitions.map(slot => slot.name), 'unassigned'];
      slotOrder.forEach(slotName => {
      if (!groups.has(slotName)) return;
        const groupEntries = groups.get(slotName);
        const slotDef = slotDefinitions.find(slot => slot.name === slotName);
        const equippedCount = groupEntries.filter(entry => entry.equipped).length;
        const slotCapacity = slotDef ? slotDef.capacity : groupEntries.length;
        const metaText = slotName === 'unassigned'
          ? `${groupEntries.length} items`
          : `${equippedCount}/${slotCapacity} equipped`;
        const section = document.createElement('div');
        section.className = 'inventory-slot-section';
        section.dataset.slotName = slotName;
        section.classList.add('inventory-drop-zone');
        section.innerHTML = `
          <div class="inventory-slot-section-header">
            <span>${slotName === 'unassigned' ? 'General' : escapeHtml(slotName)}</span>
            <span class="inventory-slot-section-capacity">${metaText}</span>
          </div>
        `;
        const list = document.createElement('div');
        list.className = 'inventory-slot-list-inner';
        list.dataset.slotName = slotName;
        list.classList.add('inventory-drop-zone');
        if (!groupEntries.length) {
          const placeholder = document.createElement('div');
          placeholder.className = 'inventory-placeholder';
          placeholder.textContent = slotName === 'unassigned'
            ? 'Drag items here to store them.'
            : `Drag compatible items here to equip in the ${slotName} slot.`;
          list.appendChild(placeholder);
        } else {
          groupEntries.forEach((entry, entryIndex) => {
            // Always read current state from the actual array entry, not cached data
            const actualIndex = entry.originalIndex !== undefined ? entry.originalIndex : -1;
            if (actualIndex === -1) return;
            
            // Read directly from the current array state
            const actualEntry = assignedItems[actualIndex];
            if (!actualEntry) return;
            
            // Format the entry to get current state
            const formatted = formatAssignmentEntry(actualEntry);
            const { item } = entry;
            if (!item) return;
            
            // Use the current equipped state from the formatted entry
            const currentlyEquipped = Boolean(formatted.equipped);
            console.log(`Rendering item ${item.id} at index ${actualIndex}, equipped: ${currentlyEquipped}`);
            const quantity = formatted.quantity || 1;
            const quantityText = quantity > 1 ? ` ×${quantity}` : '';
            const row = document.createElement('div');
            row.className = 'inventory-slot-row';
            row.dataset.slotName = slotName;
            // Only show equip button if item has a slot (is equippable)
            const isEquippable = item.slot && item.slot !== '';
            const equipButton = isEquippable 
              ? `<button type="button" class="btn-small" data-item-id="${item.id}" data-slot="${slotName}" data-equipped="${currentlyEquipped ? 'true' : 'false'}" data-entry-index="${actualIndex}">
                  ${currentlyEquipped ? 'Unequip' : 'Equip'}
                </button>`
              : '';
            row.innerHTML = `
              <div>
                <div class="inventory-slot-name">${escapeHtml(item.name || 'Unnamed Item')}${quantityText}</div>
                <div class="inventory-slot-meta">${escapeHtml(createEquipDisplay(item))}</div>
              </div>
              <div class="inventory-slot-actions">
                ${equipButton}
                <button type="button" class="btn-small btn-danger" data-item-id="${item.id}" data-slot="${slotName}" data-remove="true" data-entry-index="${actualIndex}">Remove</button>
              </div>
            `;
            list.appendChild(row);
          });
        }
        section.appendChild(list);
        inventorySlotList.appendChild(section);
      });
      // Use event delegation - attach listener once to parent container
      // Remove any existing listener first to prevent duplicates
      if (inventorySlotList.dataset.listenersAttached !== 'true') {
        inventorySlotList.addEventListener('click', (e) => {
          const button = e.target.closest('.inventory-slot-actions button');
          if (!button) return;
          
          console.log('Inventory action button clicked');
          e.stopPropagation();
          e.preventDefault();
          
          const itemIdAttr = button.getAttribute('data-item-id');
          const slot = button.getAttribute('data-slot');
          const entryIndexAttr = button.getAttribute('data-entry-index');
          
          console.log('Button data:', { itemIdAttr, slot, entryIndexAttr, action: button.getAttribute('data-remove') ? 'remove' : 'equip' });
          
          if (!itemIdAttr) return;
          
          const itemId = parseInt(itemIdAttr, 10);
          if (isNaN(itemId)) return;
          
          if (button.getAttribute('data-remove') === 'true') {
            // For remove, use the specific entry index if available
            if (entryIndexAttr && entryIndexAttr !== '-1' && entryIndexAttr !== 'undefined') {
              const entryIndex = parseInt(entryIndexAttr, 10);
              if (!isNaN(entryIndex) && entryIndex >= 0) {
                const list = inventoryAssignments[selectedInventoryHolder] || [];
                if (list[entryIndex]) {
                  const formatted = formatAssignmentEntry(list[entryIndex]);
                  if (formatted.id === itemId) {
                    removeAssignmentByIndex(selectedInventoryHolder, entryIndex);
                    return;
                  }
                }
              }
            }
            removeAssignment(selectedInventoryHolder, itemId);
            return;
          }
          
          // This is an equip/unequip button
          const currentlyEquipped = button.getAttribute('data-equipped') === 'true';
          console.log('Toggling equip state. Current:', currentlyEquipped, 'New:', !currentlyEquipped);
          
          // Use the specific entry index if available, otherwise fall back to the old method
          if (entryIndexAttr && entryIndexAttr !== '-1' && entryIndexAttr !== 'undefined') {
            const entryIndex = parseInt(entryIndexAttr, 10);
            if (!isNaN(entryIndex) && entryIndex >= 0) {
              console.log('Using index-based toggle:', entryIndex);
              toggleItemEquippedStateByIndex(selectedInventoryHolder, entryIndex, !currentlyEquipped, itemId);
              return;
            }
          }
          console.log('Using ID-based toggle');
          toggleItemEquippedState(selectedInventoryHolder, itemId, slot, !currentlyEquipped);
        });
        inventorySlotList.dataset.listenersAttached = 'true';
      }
    }

    function removeAssignment(holderKey, itemId, decreaseQuantity = true) {
      if (!holderKey || typeof itemId !== 'number') return;
      if (!Array.isArray(inventoryAssignments[holderKey])) return;
      const item = inventoryItems.find(it => it && it.id === itemId);
      if (item && item.stackable && decreaseQuantity) {
        // For stackable items, find the first non-equipped stack to decrease
        const index = inventoryAssignments[holderKey].findIndex(entry => {
          const formatted = formatAssignmentEntry(entry);
          return formatted.id === itemId && !formatted.equipped;
        });
        if (index !== -1) {
          const entry = formatAssignmentEntry(inventoryAssignments[holderKey][index]);
          if (entry.quantity > 1) {
            entry.quantity = entry.quantity - 1;
            inventoryAssignments[holderKey][index] = entry;
            renderInventoryPreview();
            updateInventoryPreviewSummary();
            updateInventoryAddSelect();
            return;
          }
        }
      }
      // For non-stackable items or when quantity is 1, find and remove the first matching entry
      const index = inventoryAssignments[holderKey].findIndex(entry => {
        const formatted = formatAssignmentEntry(entry);
        return formatted.id === itemId;
      });
      if (index !== -1) {
        inventoryAssignments[holderKey].splice(index, 1);
        renderInventoryPreview();
        updateInventoryPreviewSummary();
        updateInventoryAddSelect();
      }
    }

    function removeAssignmentByIndex(holderKey, entryIndex) {
      if (!holderKey || entryIndex === -1 || isNaN(entryIndex)) return;
      if (!Array.isArray(inventoryAssignments[holderKey])) return;
      if (entryIndex < 0 || entryIndex >= inventoryAssignments[holderKey].length) return;
      
      const entry = inventoryAssignments[holderKey][entryIndex];
      const formatted = formatAssignmentEntry(entry);
      const item = inventoryItems.find(it => it && it.id === formatted.id);
      
      if (item && item.stackable && formatted.quantity > 1) {
        formatted.quantity = formatted.quantity - 1;
        inventoryAssignments[holderKey][entryIndex] = formatted;
      } else {
        inventoryAssignments[holderKey].splice(entryIndex, 1);
      }
      renderInventoryPreview();
      updateInventoryPreviewSummary();
      updateInventoryAddSelect();
    }


    function getInventorySummaryText() {
      if (inventoryMode === 'disabled') {
        return 'Disabled';
      }
      const itemCount = Array.isArray(inventoryItems) ? inventoryItems.length : 0;
      const itemLabel = itemCount === 1 ? 'item' : 'items';
      if (inventoryMode === 'player') {
        return `Player inventory enabled (${itemCount} ${itemLabel})`;
      }
      const characterCount = Array.isArray(characters) ? characters.length : 0;
      const characterLabel = characterCount === 1 ? 'character' : 'characters';
      if (characterCount === 0) {
        return `Player & characters (${itemCount} ${itemLabel}, no characters yet)`;
      }
      return `Player & ${characterCount} ${characterLabel} (${itemCount} ${itemLabel})`;
    }

    function updateInventoryPreviewSummary() {
      const summaryEl = document.getElementById('inventory-summary-text');
      if (summaryEl) {
        summaryEl.textContent = getInventorySummaryText();
      }
    }

    function nextInventoryItemId() {
      inventoryItemAutoIncrement = Math.max(inventoryItemAutoIncrement + 1, Date.now());
      return inventoryItemAutoIncrement;
    }

    function normalizeEquipSlot(slot = {}) {
      const normalized = {
        id: typeof slot.id === 'number' ? slot.id : ++inventoryEquipSlotAutoIncrement,
        name: slot.name || '',
        capacity: Math.max(1, parseInt(slot.capacity, 10) || 1)
      };
      return normalized;
    }

    function normalizeInventoryItem(item = {}) {
      const allowedTypes = ['equippable', 'consumable', 'misc'];
      const allowedRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'unique'];
      const typeValue = typeof item.type === 'string' ? item.type.toLowerCase() : '';
      const rarityValue = typeof item.rarity === 'string' ? item.rarity.toLowerCase() : '';
      const normalized = {
        id: typeof item.id === 'number' ? item.id : nextInventoryItemId(),
        name: item.name || '',
        category: item.category || '',
        type: allowedTypes.includes(typeValue) ? typeValue : 'misc',
        slot: item.slot || '',
        rarity: allowedRarities.includes(rarityValue) ? rarityValue : 'common',
        description: item.description || '',
        condition: item.condition || '',
        usageCost: item.usageCost || '',
        stats: item.stats || item.effects || '',
        stackable: typeof item.stackable === 'boolean' ? item.stackable : false,
        maxStack: typeof item.maxStack === 'number' && item.maxStack > 0 ? item.maxStack : (item.stackable ? 99 : 1)
      };
      return normalized;
    }

    function createEmptyInventoryItem() {
      return {
        id: nextInventoryItemId(),
        name: 'New Item',
        category: '',
        type: 'misc',
        slot: '',
        rarity: 'common',
        description: '',
        condition: '',
        usageCost: '',
        stats: ''
      };
    }

    function updateEquipSlotOptions() {
      if (!inventoryItemFieldRefs || !inventoryItemFieldRefs.slot) return;
      const slotSelect = inventoryItemFieldRefs.slot;
      const slotGroup = document.getElementById('inventory-item-slot-group');
      const slots = Array.isArray(inventoryEquipSlots) ? inventoryEquipSlots : [];
      const previousValue = slotSelect.value;
      const options = ['<option value="">Select slot...</option>'];
      slots.forEach(slot => {
        options.push(`<option value="${slot.name}">${slot.name} (max ${slot.capacity})</option>`);
      });
      slotSelect.innerHTML = options.join('');
      if (slots.some(slot => slot.name === previousValue)) {
        slotSelect.value = previousValue;
      } else {
        slotSelect.value = '';
      }
      const showSlotField = slots.length > 0 && inventoryItemFieldRefs.type && inventoryItemFieldRefs.type.value === 'equippable';
      if (slotGroup) {
        slotGroup.style.display = showSlotField ? '' : 'none';
      }
      const currentItem = inventoryItems.find(it => it && it.id === selectedInventoryItemId);
      if (currentItem && !slots.some(slot => slot.name === currentItem.slot)) {
        currentItem.slot = '';
      }
    }

    function ensureHolderAssignment(holderKey) {
      if (!holderKey) return;
      if (!Array.isArray(inventoryAssignments[holderKey])) {
        inventoryAssignments[holderKey] = [];
      } else {
        inventoryAssignments[holderKey] = inventoryAssignments[holderKey].map(entry => formatAssignmentEntry(entry));
      }
    }

    function addItemToHolder(holderKey, itemId, options = {}) {
      if (!holderKey || typeof itemId !== 'number') return false;
      if (inventoryMode === 'disabled') {
        showNotification('Enable inventory to assign items.', 'error');
        return false;
      }
      ensureInventoryAssignments();
      ensureHolderAssignment(holderKey);
      const list = inventoryAssignments[holderKey];
      const item = inventoryItems.find(it => it && it.id === itemId);
      if (!item) return false;
      
      // Check if item is stackable and already exists
      if (item.stackable) {
        const maxStack = item.maxStack || 99;
        // Find all existing non-equipped stacks of this item
        const existingStacks = list
          .map((entry, index) => {
            const formatted = formatAssignmentEntry(entry);
            if (formatted.id === itemId && !formatted.equipped) {
              return { index, entry: formatted };
            }
            return null;
          })
          .filter(item => item !== null);
        
        // Try to find a non-full stack to add to
        for (const stack of existingStacks) {
          const currentQuantity = stack.entry.quantity || 1;
          if (currentQuantity < maxStack) {
            // Add to this existing stack if not at max
            stack.entry.quantity = currentQuantity + 1;
            list[stack.index] = stack.entry;
            renderInventoryPreview();
            updateInventoryPreviewSummary();
            updateInventoryAddSelect();
            return true;
          }
        }
        // If all existing stacks are at max, fall through to create a new stack
      }
      // Non-stackable items can be added multiple times (e.g., multiple swords)
      
      const entry = {
        id: itemId,
        equipped: Boolean(options.equipped && item.slot),
        quantity: 1
      };
      list.push(entry);
      renderInventoryPreview();
      updateInventoryPreviewSummary();
      updateInventoryAddSelect();
      return true;
    }

    function countEquippedInSlot(holderKey, slotName) {
      if (!holderKey || !slotName) return 0;
      ensureHolderAssignment(holderKey);
      const list = inventoryAssignments[holderKey] || [];
      return list.filter(entry => {
        const formatted = formatAssignmentEntry(entry);
        if (!formatted.equipped) return false;
        const entryItem = inventoryItems.find(it => it && it.id === formatted.id);
        return entryItem && entryItem.slot === slotName;
      }).length;
    }

    function toggleItemEquippedState(holderKey, itemId, slotName, shouldEquip) {
      if (!holderKey || typeof itemId !== 'number') return;
      ensureHolderAssignment(holderKey);
      const list = inventoryAssignments[holderKey];
      const index = list.findIndex(entry => formatAssignmentEntry(entry).id === itemId);
      if (index === -1) {
        if (shouldEquip) {
          addItemToHolder(holderKey, itemId, { equipped: true });
        }
        return;
      }
      const item = inventoryItems.find(it => it && it.id === itemId);
      if (!item) return;
      const formatted = formatAssignmentEntry(list[index]);
      if (!shouldEquip) {
        formatted.equipped = false;
        list[index] = formatted;
        renderInventoryPreview();
        updateInventoryPreviewSummary();
        return;
      }
      if (!item.slot) {
        showNotification('Only equippable items can be equipped.', 'error');
        return;
      }
      const targetSlot = slotName && slotName !== 'unassigned' ? slotName : item.slot;
      if (targetSlot !== item.slot) {
        showNotification(`This item belongs to the "${item.slot}" slot.`, 'error');
        return;
      }
      const slotDef = inventoryEquipSlots.find(slot => slot.name === item.slot);
      const capacity = slotDef ? slotDef.capacity : 1;
      const equippedCount = countEquippedInSlot(holderKey, item.slot);
      if (!formatted.equipped && equippedCount >= capacity) {
        showNotification(`No more "${item.slot}" slots available.`, 'error');
        return;
      }
      formatted.equipped = true;
      list[index] = formatted;
      renderInventoryPreview();
      updateInventoryPreviewSummary();
    }

    function toggleItemEquippedStateByIndex(holderKey, entryIndex, shouldEquip, expectedItemId = null) {
      console.log('toggleItemEquippedStateByIndex', { holderKey, entryIndex, shouldEquip, expectedItemId });
      if (!holderKey || entryIndex === -1 || isNaN(entryIndex)) return;
      
      // Ensure holder exists FIRST
      ensureHolderAssignment(holderKey);
      
      // Get direct reference to array AFTER ensureHolderAssignment
      const list = inventoryAssignments[holderKey];
      if (!list || entryIndex < 0 || entryIndex >= list.length) {
        console.error('Invalid entry index:', entryIndex, 'List length:', list ? list.length : 0);
        return;
      }
      
      // Get direct reference to the entry object from the CURRENT array
      let entry = list[entryIndex];
      
      // Ensure entry is an object (not a number) - modify in place if possible
      if (typeof entry !== 'object' || entry === null) {
        entry = formatAssignmentEntry(entry);
        list[entryIndex] = entry;
        // Re-read to ensure we have the actual reference
        entry = list[entryIndex];
      }
      
      // Verify item ID if provided
      if (expectedItemId !== null && entry.id !== expectedItemId) {
        console.error('Item ID mismatch at index', entryIndex, 'Expected:', expectedItemId, 'Found:', entry.id);
        // Fallback to ID search if index is stale
        toggleItemEquippedState(holderKey, expectedItemId, null, shouldEquip);
        return;
      }
      
      const item = inventoryItems.find(it => it && it.id === entry.id);
      if (!item) {
        console.error('Item not found:', entry.id);
        return;
      }
      
      if (!shouldEquip) {
        entry.equipped = false;
        // Ensure the change is reflected in the array
        list[entryIndex] = entry;
        console.log('Unequipped item at index', entryIndex);
        showNotification('Item unequipped', 'info');
        renderInventoryPreview();
        updateInventoryPreviewSummary();
        return;
      }
      
      if (!item.slot) {
        showNotification('Only equippable items can be equipped.', 'error');
        return;
      }
      
      const slotDef = inventoryEquipSlots.find(slot => slot.name === item.slot);
      const capacity = slotDef ? slotDef.capacity : 1;
      const equippedCount = countEquippedInSlot(holderKey, item.slot);
      
      console.log('Checking capacity', { itemSlot: item.slot, capacity, equippedCount, currentlyEquipped: entry.equipped });
      
      if (!entry.equipped && equippedCount >= capacity) {
        showNotification(`No more "${item.slot}" slots available.`, 'error');
        return;
      }
      
      // CRITICAL: Get fresh reference from array right before modifying
      // This ensures we're modifying the actual object in the current array
      const actualEntry = inventoryAssignments[holderKey][entryIndex];
      if (actualEntry !== entry) {
        console.warn('Entry reference changed, using actual entry from array');
        entry = actualEntry;
        // Ensure it's an object
        if (typeof entry !== 'object' || entry === null) {
          entry = formatAssignmentEntry(entry);
          inventoryAssignments[holderKey][entryIndex] = entry;
        }
      }
      
      // Now modify the actual entry in the array
      entry.equipped = true;
      // Explicitly set it back to ensure persistence
      inventoryAssignments[holderKey][entryIndex] = entry;
      
      // Verify the state persisted
      const verifyEntry = inventoryAssignments[holderKey][entryIndex];
      if (verifyEntry.equipped !== true) {
        console.error('CRITICAL: Equipped state not persisted!', verifyEntry);
        // Force it one more time
        verifyEntry.equipped = true;
        inventoryAssignments[holderKey][entryIndex] = verifyEntry;
      }
      
      console.log('Equipped item at index', entryIndex, 'Final state:', inventoryAssignments[holderKey][entryIndex]);
      showNotification('Item equipped', 'success');
      renderInventoryPreview();
      updateInventoryPreviewSummary();
    }

    function removeItemFromAssignments(itemId) {
      Object.keys(inventoryAssignments).forEach(key => {
        if (Array.isArray(inventoryAssignments[key])) {
          inventoryAssignments[key] = inventoryAssignments[key].filter(entry => {
            const formatted = formatAssignmentEntry(entry);
            return formatted.id !== itemId;
          });
        }
      });
      renderInventoryPreview();
      updateInventoryPreviewSummary();
      updateInventoryAddSelect();
    }

    renderInventoryItemsList = function() {
      if (!inventoryItemList) return;
      inventoryItemList.innerHTML = '';
      if (!Array.isArray(inventoryItems)) {
        inventoryItems = [];
      }
      if (!inventoryItems.length) {
        const placeholder = document.createElement('div');
        placeholder.className = 'inventory-placeholder';
        placeholder.textContent = 'No items yet. Create one to get started.';
        inventoryItemList.appendChild(placeholder);
        selectedInventoryItemId = null;
        updateInventoryItemForm();
        return;
      }
      if (!inventoryItems.some(item => item && item.id === selectedInventoryItemId)) {
        selectedInventoryItemId = inventoryItems[0].id;
      }
      inventoryItems.forEach(item => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'inventory-item-row';
        button.setAttribute('draggable', 'true');
        button.dataset.itemId = String(item.id);
        if (item.id === selectedInventoryItemId) {
          button.classList.add('active');
        }
        const displayName = escapeHtml(item.name || 'Unnamed Item');
        const typeLabel = item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Miscellaneous';
        const rarityLabel = item.rarity ? item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1) : '';
        button.innerHTML = `
          <span class="inventory-item-row-name">${displayName}</span>
          <span class="inventory-item-row-meta">${escapeHtml(typeLabel)}${rarityLabel ? ' · ' + escapeHtml(rarityLabel) : ''}</span>
        `;
        button.addEventListener('click', () => {
          selectedInventoryItemId = item.id;
          renderInventoryItemsList();
        });
        button.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', String(item.id));
          currentDraggedItemId = item.id;
          button.classList.add('dragging');
        });
        button.addEventListener('dragend', () => {
          button.classList.remove('dragging');
          currentDraggedItemId = null;
        });
        inventoryItemList.appendChild(button);
      });
      updateInventoryItemForm();
      updateInventoryPreviewSummary();
    updateInventoryAddSelect();
    }

    renderEquipSlotsList = function() {
      if (!inventoryEquipSlotList) return;
      inventoryEquipSlotList.innerHTML = '';
      if (!Array.isArray(inventoryEquipSlots) || !inventoryEquipSlots.length) {
        if (inventoryEquipSlotEmptyState) {
          inventoryEquipSlotEmptyState.style.display = '';
        }
        if (inventoryEquipSlotForm) inventoryEquipSlotForm.style.display = 'none';
        if (inventoryEquipSlotDeleteBtn) inventoryEquipSlotDeleteBtn.style.display = 'none';
        updateEquipSlotOptions();
        return;
      }
      if (inventoryEquipSlotEmptyState) {
        inventoryEquipSlotEmptyState.style.display = 'none';
      }
      const activeId = inventoryEquipSlotForm && inventoryEquipSlotForm.dataset.slotId ? parseInt(inventoryEquipSlotForm.dataset.slotId, 10) : null;
      inventoryEquipSlots.forEach((slot, idx) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'inventory-equip-slot-row';
        row.dataset.slotId = String(slot.id);
        if (slot.id === activeId) {
          row.classList.add('active');
        }
        row.innerHTML = `
          <span>${escapeHtml(slot.name || `Slot ${idx + 1}`)}</span>
          <span style="font-size:0.8rem;color:var(--color-muted)">Max ${slot.capacity}</span>
        `;
        row.addEventListener('click', () => {
          openEquipSlotForm(slot);
        });
        inventoryEquipSlotList.appendChild(row);
      });
      updateEquipSlotOptions();
    };

    openEquipSlotForm = function(slot = null) {
      if (!inventoryEquipSlotForm) return;
      inventoryEquipSlotForm.style.display = 'flex';
      inventoryEquipSlotForm.dataset.slotId = slot && typeof slot.id === 'number' ? String(slot.id) : '';
      if (inventoryEquipSlotNameInput) inventoryEquipSlotNameInput.value = slot ? slot.name : '';
      if (inventoryEquipSlotCapacityInput) inventoryEquipSlotCapacityInput.value = slot ? slot.capacity : 1;
      if (inventoryEquipSlotDeleteBtn) {
        inventoryEquipSlotDeleteBtn.style.display = slot ? '' : 'none';
      }
      if (inventoryEquipSlotList) {
        inventoryEquipSlotList.querySelectorAll('.inventory-equip-slot-row').forEach(row => {
          const rowId = parseInt(row.dataset.slotId || '0', 10);
          row.classList.toggle('active', slot && slot.id === rowId);
        });
      }
    };

    closeEquipSlotForm = function() {
      if (inventoryEquipSlotForm) {
        inventoryEquipSlotForm.style.display = 'none';
        inventoryEquipSlotForm.dataset.slotId = '';
      }
      if (inventoryEquipSlotDeleteBtn) {
        inventoryEquipSlotDeleteBtn.style.display = 'none';
      }
      if (inventoryEquipSlotNameInput) inventoryEquipSlotNameInput.value = '';
      if (inventoryEquipSlotCapacityInput) inventoryEquipSlotCapacityInput.value = 1;
      if (inventoryEquipSlotList) {
        inventoryEquipSlotList.querySelectorAll('.inventory-equip-slot-row').forEach(row => {
          row.classList.remove('active');
        });
      }
    };

    saveEquipSlot = function() {
      if (!inventoryEquipSlotNameInput || !inventoryEquipSlotCapacityInput) return;
      const slotName = inventoryEquipSlotNameInput.value.trim();
      const capacity = Math.max(1, parseInt(inventoryEquipSlotCapacityInput.value, 10) || 1);
      if (!slotName) {
        alert('Please enter a slot name.');
  showNotification('Please enter a slot name.', 'error');
        return;
      }
      const existingId = inventoryEquipSlotForm && inventoryEquipSlotForm.dataset.slotId ? parseInt(inventoryEquipSlotForm.dataset.slotId, 10) : null;
      if (existingId !== null && !Number.isNaN(existingId)) {
        const slotIdx = inventoryEquipSlots.findIndex(slot => slot.id === existingId);
        if (slotIdx !== -1) {
          inventoryEquipSlots[slotIdx] = normalizeEquipSlot({ id: existingId, name: slotName, capacity });
        }
      } else {
        const newSlot = normalizeEquipSlot({ name: slotName, capacity });
        inventoryEquipSlots.push(newSlot);
      }
      if (inventoryItemFieldRefs.slot && inventoryItemFieldRefs.slot.value && !inventoryEquipSlots.some(slot => slot.name === inventoryItemFieldRefs.slot.value)) {
        inventoryItemFieldRefs.slot.value = '';
      }
      renderEquipSlotsList();
      closeEquipSlotForm();
      renderInventoryItemsList();
    };

    deleteEquipSlot = function() {
      const existingId = inventoryEquipSlotForm && inventoryEquipSlotForm.dataset.slotId ? parseInt(inventoryEquipSlotForm.dataset.slotId, 10) : null;
      if (existingId === null || Number.isNaN(existingId)) {
        closeEquipSlotForm();
        return;
      }
      const slot = inventoryEquipSlots.find(slot => slot.id === existingId);
      if (!slot) {
        closeEquipSlotForm();
        return;
      }
      if (!confirm(`Delete equip slot "${slot.name}"? Items referencing this slot will lose their slot assignment.`)) return;
      inventoryEquipSlots = inventoryEquipSlots.filter(slot => slot.id !== existingId);
      inventoryItems.forEach(item => {
        if (item.slot === slot.name) {
          item.slot = '';
        }
      });
      renderEquipSlotsList();
      renderInventoryItemsList();
      closeEquipSlotForm();
    };

    function updateInventoryItemForm() {
      if (!inventoryItemForm || !inventoryItemEmptyState) return;
      const item = inventoryItems.find(it => it && it.id === selectedInventoryItemId);
      if (!item) {
        inventoryItemForm.style.display = 'none';
        inventoryItemEmptyState.style.display = '';
        if (inventoryDeleteItemBtn) {
          inventoryDeleteItemBtn.style.display = 'none';
        }
        Object.values(inventoryItemFieldRefs).forEach(field => {
          if (field) field.value = '';
        });
        return;
      }
      inventoryItemForm.style.display = 'grid';
      inventoryItemEmptyState.style.display = 'none';
      if (inventoryDeleteItemBtn) {
        inventoryDeleteItemBtn.style.display = '';
      }
      if (inventoryItemFieldRefs.name) inventoryItemFieldRefs.name.value = item.name || '';
      if (inventoryItemFieldRefs.category) inventoryItemFieldRefs.category.value = item.category || '';
      if (inventoryItemFieldRefs.type) inventoryItemFieldRefs.type.value = item.type || 'misc';
      const slotGroup = document.getElementById('inventory-item-slot-group');
      if (inventoryItemFieldRefs.slot) {
        const hasSlots = Array.isArray(inventoryEquipSlots) && inventoryEquipSlots.length > 0;
        const shouldShowSlot = hasSlots && item.type === 'equippable';
        if (slotGroup) {
          slotGroup.style.display = shouldShowSlot ? '' : 'none';
        }
        const options = ['<option value="">Select slot...</option>'].concat(
          (inventoryEquipSlots || []).map(slot => `<option value="${slot.name}" ${item.slot === slot.name ? 'selected' : ''}>${slot.name} (max ${slot.capacity})</option>`)
        );
        inventoryItemFieldRefs.slot.innerHTML = options.join('');
        if (!shouldShowSlot) {
          inventoryItemFieldRefs.slot.value = '';
          item.slot = '';
        }
      }
      if (inventoryItemFieldRefs.rarity) inventoryItemFieldRefs.rarity.value = item.rarity || 'common';
      if (inventoryItemFieldRefs.description) inventoryItemFieldRefs.description.value = item.description || '';
      if (inventoryItemFieldRefs.condition) inventoryItemFieldRefs.condition.value = item.condition || '';
      if (inventoryItemFieldRefs.usageCost) inventoryItemFieldRefs.usageCost.value = item.usageCost || '';
      if (inventoryItemFieldRefs.stats) inventoryItemFieldRefs.stats.value = item.stats || '';
      if (inventoryItemFieldRefs.stackable) inventoryItemFieldRefs.stackable.checked = item.stackable || false;
      if (inventoryItemFieldRefs.maxStack) {
        inventoryItemFieldRefs.maxStack.value = item.maxStack || (item.stackable ? 99 : 1);
        const maxStackGroup = document.getElementById('inventory-item-max-stack-group');
        if (maxStackGroup) {
          maxStackGroup.style.display = item.stackable ? '' : 'none';
        }
      }
    };
    function setInventoryMode(mode, options = {}) {
      const allowedModes = ['disabled', 'player', 'all'];
      const normalized = allowedModes.includes(mode) ? mode : 'disabled';
      const modeChanged = inventoryMode !== normalized;
      inventoryMode = normalized;
      ensureInventoryAssignments();
      ensureSelectedInventoryHolder();
      if (!options.skipRadioSync) {
        syncInventoryModeRadios();
      }
      if (!options.skipSidebar) {
        renderInventorySidebar();
      }
      if (!options.skipPreview) {
        renderInventoryPreview();
      }
      updateEquipSlotOptions();
      updateInventoryWorkspaceState();
      updateInventoryPreviewSummary();
      updateInventoryAddSelect();
      return modeChanged;
    }

    if (inventoryModeRadios && inventoryModeRadios.length) {
      inventoryModeRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
          if (event.target.checked) {
            setInventoryMode(event.target.value);
          }
        });
      });
    }

    if (inventoryAddItemBtn) {
      inventoryAddItemBtn.addEventListener('click', () => {
        const newItem = createEmptyInventoryItem();
        inventoryItems.push(newItem);
        selectedInventoryItemId = newItem.id;
        renderInventoryItemsList();
      });
    }

    if (inventoryAddEquipSlotBtn) {
      inventoryAddEquipSlotBtn.addEventListener('click', () => {
        openEquipSlotForm();
      });
    }

    if (inventoryEquipSlotSaveBtn) {
      inventoryEquipSlotSaveBtn.addEventListener('click', () => {
        saveEquipSlot();
      });
    }

    if (inventoryEquipSlotCancelBtn) {
      inventoryEquipSlotCancelBtn.addEventListener('click', () => {
        closeEquipSlotForm();
      });
    }

    if (inventoryEquipSlotDeleteBtn) {
      inventoryEquipSlotDeleteBtn.addEventListener('click', () => {
        deleteEquipSlot();
      });
    }

    if (inventorySlotList) {
      inventorySlotList.dataset.slotName = 'unassigned';
      // Use event delegation for dynamically created drop zones
      inventorySlotList.addEventListener('dragenter', (e) => {
        if (e.target.closest('[data-slot-name]') || e.target === inventorySlotList) {
          handleInventoryDragOver(e);
        }
      });
      inventorySlotList.addEventListener('dragover', (e) => {
        if (e.target.closest('[data-slot-name]') || e.target === inventorySlotList) {
          handleInventoryDragOver(e);
        }
      });
      inventorySlotList.addEventListener('dragleave', handleInventoryDragLeave);
      inventorySlotList.addEventListener('drop', (e) => {
        if (e.target.closest('[data-slot-name]') || e.target === inventorySlotList) {
          handleInventoryDrop(e);
        }
      });
    }

    if (inventoryAddItemSelect) {
      inventoryAddItemSelect.addEventListener('change', () => {
        if (inventoryAssignBtn) {
          inventoryAssignBtn.disabled = !inventoryAddItemSelect.value;
        }
      });
    }

    if (inventoryAssignBtn) {
      inventoryAssignBtn.addEventListener('click', () => {
        if (!inventoryAddItemSelect || !inventoryAddItemSelect.value) return;
        const itemId = parseInt(inventoryAddItemSelect.value, 10);
        if (Number.isNaN(itemId)) return;
        if (addItemToHolder(selectedInventoryHolder, itemId)) {
          toggleItemEquippedState(selectedInventoryHolder, itemId, 'unassigned', false);
          inventoryAddItemSelect.value = '';
          inventoryAssignBtn.disabled = true;
        }
      });
    }

    if (inventoryDeleteItemBtn) {
      inventoryDeleteItemBtn.addEventListener('click', () => {
        if (!selectedInventoryItemId) return;
        const index = inventoryItems.findIndex(item => item && item.id === selectedInventoryItemId);
        if (index !== -1) {
          const removed = inventoryItems.splice(index, 1)[0];
          if (removed) {
            removeItemFromAssignments(removed.id);
          }
          selectedInventoryItemId = null;
          renderInventoryItemsList();
        }
      });
    }

    function updateActiveInventoryItemRowDisplay() {
      if (!inventoryItemList) return;
      const activeRow = inventoryItemList.querySelector('.inventory-item-row.active');
      if (!activeRow) return;
      const item = inventoryItems.find(it => it && it.id === selectedInventoryItemId);
      if (!item) return;
      const nameEl = activeRow.querySelector('.inventory-item-row-name');
      const metaEl = activeRow.querySelector('.inventory-item-row-meta');
      if (nameEl) {
        nameEl.textContent = item.name || 'Unnamed Item';
      }
      if (metaEl) {
        const typeLabel = item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Miscellaneous';
        const rarityLabel = item.rarity ? item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1) : '';
        metaEl.textContent = rarityLabel ? `${typeLabel} · ${rarityLabel}` : typeLabel;
      }
    }

    Object.entries(inventoryItemFieldRefs).forEach(([field, element]) => {
      if (!element) return;
      const eventName = element.tagName === 'SELECT' ? 'change' : (element.type === 'checkbox' ? 'change' : 'input');
      element.addEventListener(eventName, (e) => {
        const item = inventoryItems.find(it => it && it.id === selectedInventoryItemId);
        if (!item) return;
        if (element.type === 'checkbox') {
          item[field] = e.target.checked;
          if (field === 'stackable') {
            // Show/hide maxStack field when stackable changes
            const maxStackGroup = document.getElementById('inventory-item-max-stack-group');
            if (maxStackGroup) {
              maxStackGroup.style.display = e.target.checked ? '' : 'none';
            }
            if (!e.target.checked && inventoryItemFieldRefs.maxStack) {
              item.maxStack = 1;
              inventoryItemFieldRefs.maxStack.value = 1;
            } else if (e.target.checked && (!item.maxStack || item.maxStack === 1)) {
              item.maxStack = 99;
              if (inventoryItemFieldRefs.maxStack) {
                inventoryItemFieldRefs.maxStack.value = 99;
              }
            }
          }
        } else {
          if (field === 'maxStack') {
            const value = parseInt(e.target.value, 10);
            item[field] = isNaN(value) || value < 1 ? 1 : value;
          } else {
            item[field] = e.target.value;
          }
        }
        if (['name', 'category', 'type', 'rarity'].includes(field)) {
          updateActiveInventoryItemRowDisplay();
        }
      if (field === 'type' && item.type !== 'equippable') {
        item.slot = '';
      }
      if (field === 'type' || field === 'slot') {
        updateInventoryItemForm();
      }
        renderInventoryPreview();
      });
    });
    let activeChoiceContext = null;
    let choiceEffectAutoIncrement = Date.now();
    function normalizeTraitMechanic(mechanic = {}) {
      const normalized = { ...mechanic };
      normalized.trait = normalized.trait || '';
      normalized.description = normalized.description || '';
      normalized.effects = Array.isArray(normalized.effects) ? normalized.effects : [];
      normalized.active = Object.prototype.hasOwnProperty.call(mechanic, 'active') ? Boolean(mechanic.active) : true;
      const usageCostsArray = Array.isArray(mechanic.usageCosts)
        ? mechanic.usageCosts
        : (mechanic.usageCost ? [{ resource: '', formula: mechanic.usageCost }] : []);
      normalized.usageCosts = usageCostsArray.map(cost => ({
        resource: cost && cost.resource ? cost.resource : '',
        formula: cost && cost.formula != null ? String(cost.formula) : ''
      }));
      delete normalized.usageCost;
      normalized.conditions = mechanic.conditions != null ? String(mechanic.conditions) : '';
      return normalized;
    }
    const CONDITION_OPERATORS = [
      { value: '==', label: 'Equals', supports: ['string', 'number', 'boolean'] },
      { value: '!=', label: 'Not equals', supports: ['string', 'number', 'boolean'] },
      { value: '>', label: 'Greater than', supports: ['number'] },
      { value: '>=', label: 'Greater or equal', supports: ['number'] },
      { value: '<', label: 'Less than', supports: ['number'] },
      { value: '<=', label: 'Less or equal', supports: ['number'] },
      { value: 'includes', label: 'Contains', supports: ['string', 'array'] },
      { value: 'exists', label: 'Exists', supports: ['string', 'number', 'boolean', 'array'], valueOptional: true },
      { value: 'not_exists', label: 'Does not exist', supports: ['string', 'number', 'boolean', 'array'], valueOptional: true }
    ];
    const CHOICE_EFFECT_OPERATIONS = [
      { value: 'set', label: 'Set to' },
      { value: 'add', label: 'Add' },
      { value: 'subtract', label: 'Subtract' }
    ];
    let conditionRuleAutoIncrement = Date.now();
    function createEmptyConditionRule() {
      return {
        id: ++conditionRuleAutoIncrement,
        scope: 'global',
        variable: '',
        operator: '==',
        valueType: 'string',
        value: '',
        characterId: null
      };
    }
    function cloneConditionRules(rules) {
      return (rules || []).map(rule => ({
        id: rule.id ?? ++conditionRuleAutoIncrement,
        scope: rule.scope || 'global',
        variable: rule.variable || '',
        operator: rule.operator || '==',
        valueType: rule.valueType || guessValueType(rule.value),
        value: rule.value !== undefined ? rule.value : '',
        characterId: typeof rule.characterId === 'number' ? rule.characterId : null
      }));
    }
    function guessValueType(value) {
      if (value === undefined || value === null) return 'string';
      if (typeof value === 'boolean') return 'boolean';
      if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'float';
      if (Array.isArray(value)) return 'array';
      return 'string';
    }
    function parseValueForType(value, type) {
      if (type === 'boolean') {
        if (typeof value === 'boolean') return value;
        return value === 'true' || value === true;
      }
      if (type === 'integer') {
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      if (type === 'float' || type === 'number') {
        const parsed = parseFloat(value);
        return Number.isNaN(parsed) ? 0 : parsed;
      }
      if (type === 'array') {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
          return value.split(',').map(v => v.trim()).filter(Boolean);
        }
        return [];
      }
      return String(value ?? '');
    }
    function convertLegacyConditionsToRules(conditions) {
      if (!conditions) return [];
      if (Array.isArray(conditions)) {
        return cloneConditionRules(conditions);
      }
      if (conditions && Array.isArray(conditions.rules)) {
        return cloneConditionRules(conditions.rules);
      }
      if (typeof conditions === 'object') {
        return Object.keys(conditions).map(key => ({
          id: ++conditionRuleAutoIncrement,
          scope: 'global',
          variable: key,
          operator: '==',
          valueType: guessValueType(conditions[key]),
          value: conditions[key],
          characterId: null
        }));
      }
      // Could be a string/JSON
      return [];
    }
    function serializeRulesToConditions(rules) {
      const cleanRules = cloneConditionRules(rules).filter(rule => rule.variable);
      if (!cleanRules.length) return undefined;
      return {
        logic: 'all',
        rules: cleanRules.map(rule => ({
          scope: rule.scope || 'global',
          variable: rule.variable || '',
          operator: rule.operator || '==',
          valueType: rule.valueType || 'string',
          value: rule.value,
          ...(rule.scope === 'character' && typeof rule.characterId === 'number'
            ? { characterId: rule.characterId }
            : {})
        }))
      };
    }
    function formatConditionSummary(conditions) {
      if (!conditions) return '<span style="color: var(--color-muted); font-style: italic;">No conditions</span>';
      if (Array.isArray(conditions)) {
        return `<code>${escapeHtml(JSON.stringify(conditions))}</code>`;
      }
      if (conditions && Array.isArray(conditions.rules)) {
        if (!conditions.rules.length) {
          return '<span style="color: var(--color-muted); font-style: italic;">No conditions</span>';
        }
        const parts = conditions.rules.map(rule => {
          const operatorConfig = CONDITION_OPERATORS.find(op => op.value === rule.operator);
          const label = operatorConfig ? operatorConfig.label : rule.operator;
          let valueDisplay;
          if (rule.valueType === 'boolean') {
            valueDisplay = rule.value ? 'true' : 'false';
          } else if (rule.valueType === 'array') {
            valueDisplay = `[${(rule.value || []).join(', ')}]`;
          } else {
            valueDisplay = rule.value;
          }
          let scopeLabel = rule.scope || 'global';
          if (rule.scope === 'character' && typeof rule.characterId === 'number') {
            const character = characters && characters[rule.characterId];
            const characterName = character ? (character.name || `Character ${rule.characterId + 1}`) : `Character ${rule.characterId + 1}`;
            scopeLabel = `character(${characterName})`;
          }
          return `${scopeLabel}:${rule.variable} ${label} ${valueDisplay ?? ''}`.trim();
        });
        return `<code>${escapeHtml(parts.join(' AND '))}</code>`;
      }
      if (typeof conditions === 'object') {
        return `<code>${escapeHtml(JSON.stringify(conditions))}</code>`;
      }
      return `<code>${escapeHtml(String(conditions))}</code>`;
    }
    function escapeHtml(str) {
      return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    let currentStoryTitle = null;
    let selectedScenePath = null; // Array of indices representing the path to the selected scene

    // Load story if title param is present in URL
    const params = new URLSearchParams(window.location.search);
    const loadTitle = params.get('title');
    if (loadTitle) {
      window.__TAURI__.core.invoke('load_story', { title: loadTitle })
        .then(storyJson => {
          try {
            const storyData = JSON.parse(storyJson);
            if (Array.isArray(storyData)) {
              // Old format: just scenes
              scenes = storyData;
              characters = [];
              globalVariables = [];
              characterVariablesTemplate = [];
              inventoryMode = 'disabled';
              inventoryItems = [];
              inventoryAssignments = {};
            } else {
              scenes = storyData.scenes;
              characters = storyData.characters || [];
              globalVariables = storyData.globalVariables || [];
              characterVariablesTemplate = storyData.characterVariablesTemplate || [];
              // Initialize player data
              playerData = storyData.playerData || { name: 'Player', traits: [], variableValues: {} };
              // Initialize player variable values with template defaults if missing
              if (!playerData.variableValues || Object.keys(playerData.variableValues).length === 0) {
                playerData.variableValues = {};
                characterVariablesTemplate.forEach(templateVar => {
                  if (!(templateVar.name in playerData.variableValues)) {
                    playerData.variableValues[templateVar.name] = templateVar.defaultValue;
                  }
                });
              }
              traitMechanics = (storyData.traitMechanics || []).map(normalizeTraitMechanic);
              inventoryMode = storyData.inventoryMode || 'disabled';
              inventoryEquipSlots = Array.isArray(storyData.inventoryEquipSlots) ? storyData.inventoryEquipSlots.map(slot => normalizeEquipSlot(slot)) : [];
              const maxSlotId = inventoryEquipSlots.reduce((max, slot) => {
                if (slot && typeof slot.id === 'number') {
                  return Math.max(max, slot.id);
                }
                return max;
              }, 0);
              inventoryEquipSlotAutoIncrement = Math.max(inventoryEquipSlotAutoIncrement, maxSlotId);
              const loadedItems = Array.isArray(storyData.inventoryItems) ? storyData.inventoryItems : [];
              inventoryItems = loadedItems.map(item => normalizeInventoryItem(item));
              inventoryAssignments = normalizeInventoryAssignments(storyData.inventoryAssignments);
              const maxItemId = inventoryItems.reduce((max, item) => {
                if (item && typeof item.id === 'number') {
                  return Math.max(max, item.id);
                }
                return max;
              }, 0);
              inventoryItemAutoIncrement = Math.max(inventoryItemAutoIncrement, maxItemId);
              // Initialize traits for characters if missing
              characters.forEach(char => {
                if (!char.traits) char.traits = [];
              });
              // Migrate old character variables to template if needed
              if (characters.length > 0 && characters[0].variables && !characterVariablesTemplate.length) {
                // Use first character's variables as template
                characterVariablesTemplate = characters[0].variables.map(v => ({
                  name: v.name,
                  type: v.type,
                  defaultValue: v.defaultValue
                }));
                // Convert all characters to use variableValues
                characters.forEach(char => {
                  if (char.variables) {
                    char.variableValues = {};
                    char.variables.forEach(v => {
                      char.variableValues[v.name] = v.defaultValue;
                    });
                    delete char.variables;
                  }
                });
              }
              // Ensure all characters have variableValues
              characters.forEach(char => {
                if (!char.variableValues) {
                  char.variableValues = {};
                  characterVariablesTemplate.forEach(templateVar => {
                    char.variableValues[templateVar.name] = templateVar.defaultValue;
                  });
                }
              });
            }
            if (!inventoryMode) {
              inventoryMode = 'disabled';
            }
            if (!Array.isArray(inventoryItems)) {
              inventoryItems = [];
            }
            currentStoryTitle = loadTitle;
            storyTitleInput.value = loadTitle;
            renderSidebar();
            renderEditor();
            renderCharacters();
            renderTraitMechanics();
            renderCharacterVariablesTemplate();
            scenes.forEach(scene => {
              if (scene && typeof scene === 'object') {
                getConditionState(scene);
                syncSceneConditions(scene);
              }
            });
            renderGlobalVariables();
            setInventoryMode(inventoryMode);
            renderInventoryItemsList();
            alert('Loaded story: ' + loadTitle);
  showNotification('Loaded story: ' + loadTitle, 'success');
          } catch (e) {
            alert('Failed to parse loaded story: ' + e);
  showNotification('Failed to parse loaded story: ' + e, 'error');
          }
        })
        .catch(e => {
          alert('Failed to load story: ' + e);
  showNotification('Failed to load story: ' + e, 'error');
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
        // Only update if we haven't visited this scene yet, or if we found a shorter path
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
      // Start traversal from scene 0
      if (scenes.length > 0) {
        traverse(0, 0);
      }
      
      // For any scenes that weren't reached (not connected to scene 0), 
      // find their depth by checking if they're targets of other scenes
      // Process iteratively to handle chains of unreachable scenes
      let changed = true;
      while (changed) {
        changed = false;
        for (let idx = 0; idx < scenes.length; idx++) {
          if (sceneDepths[idx] === null) {
            // Find the minimum depth of any scene that points to this one
            let minParentDepth = null;
            for (let i = 0; i < scenes.length; i++) {
              const scene = scenes[i];
              if (scene && Array.isArray(scene.choices)) {
                scene.choices.forEach(choice => {
                  if (typeof choice.target === 'number' && choice.target === idx) {
                    if (sceneDepths[i] !== null) {
                      if (minParentDepth === null || sceneDepths[i] < minParentDepth) {
                        minParentDepth = sceneDepths[i];
                      }
                    }
                  }
                });
              }
            }
            // If we found a parent with a known depth, use that + 1, otherwise use 0
            if (minParentDepth !== null) {
              sceneDepths[idx] = minParentDepth + 1;
              changed = true;
            } else {
              // Check if this scene is referenced by any scene at all
              // If not, it's a root-level scene (depth 0)
              let hasAnyParent = false;
              for (let i = 0; i < scenes.length; i++) {
                const scene = scenes[i];
                if (scene && Array.isArray(scene.choices)) {
                  scene.choices.forEach(choice => {
                    if (typeof choice.target === 'number' && choice.target === idx) {
                      hasAnyParent = true;
                    }
                  });
                }
              }
              if (!hasAnyParent) {
                sceneDepths[idx] = 0;
                changed = true;
              }
            }
          }
        }
      }
      
      // Final pass: ensure all scenes have a depth (shouldn't be needed, but safety check)
      for (let idx = 0; idx < scenes.length; idx++) {
        if (sceneDepths[idx] === null) {
          sceneDepths[idx] = 0;
        }
      }

      // Render all scenes flat, but with indentation based on computed depth
      scenes.forEach((scene, idx) => {
        const isActive = Array.isArray(selectedScenePath) && selectedScenePath.length === 1 && selectedScenePath[0] === idx;
        const sceneItem = document.createElement('div');
        sceneItem.className = `scene-item${isActive ? ' active' : ''}`;
        // Ensure we always have a valid depth value (not null)
        const depth = sceneDepths[idx] !== null ? sceneDepths[idx] : 0;
        sceneItem.style.paddingLeft = (depth * 24 + 8) + 'px';
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

    // Track the parent scene index for the currently selected scene
    let currentParentSceneIdx = null;

    function findParentSceneIdx(targetIdx) {
      if (!Array.isArray(scenes) || typeof targetIdx !== 'number') return null;
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        if (scene && Array.isArray(scene.choices)) {
          for (let c = 0; c < scene.choices.length; c++) {
            if (scene.choices[c] && scene.choices[c].target === targetIdx) {
              return i;
            }
          }
        }
      }
      return null;
    }

    function selectCharacter(idx) {
      selectedCharacterIdx = idx;
      // Keep config section visible, show character editor
      const charactersConfigSection = document.getElementById('characters-config-section');
      const previewColumn = document.getElementById('preview-column');
      // Don't hide config section - keep it visible
      if (previewColumn) previewColumn.style.display = 'none';
      // Hide scene editor, show character editor
      if (characterEditor) characterEditor.style.display = 'block';
      // Hide scene editor content
      const sceneEditor = editorContent.querySelector('.scene-form');
      if (sceneEditor && sceneEditor !== characterEditor) sceneEditor.style.display = 'none';
      // Hide empty editor
      const emptyEditor = editorContent.querySelector('.empty-editor');
      if (emptyEditor) emptyEditor.style.display = 'none';
      
      // Handle Player selection
      if (idx === 'player') {
        // Hide delete button for player (can't delete player)
        if (deleteCharacterBtn) deleteCharacterBtn.style.display = 'none';
        if (deleteSceneBtn) deleteSceneBtn.style.display = 'none';
        // Set editor title
        if (editorTitle) editorTitle.textContent = 'Edit Player';
        // Fill form with player data (player is always named "Player")
        if (characterNameInput) characterNameInput.value = 'Player';
        if (characterGenderInput) characterGenderInput.value = '';
        if (characterBioGenderInput) characterBioGenderInput.value = '';
        if (characterTagsInput) characterTagsInput.value = '';
        // Initialize player data if needed
        if (!playerData.traits) playerData.traits = [];
        if (!playerData.variableValues) {
          playerData.variableValues = {};
          // Initialize with template defaults
          characterVariablesTemplate.forEach(templateVar => {
            if (!(templateVar.name in playerData.variableValues)) {
              playerData.variableValues[templateVar.name] = templateVar.defaultValue;
            }
          });
        }
        renderCharacterTraits();
        renderCharacterVariables();
        updateCharacterTraitSelect();
        renderTraitMechanics();
        renderCharacters();
        return;
      }
      
      // Hide scene delete button, show character delete button
      if (deleteCharacterBtn) deleteCharacterBtn.style.display = '';
      if (deleteSceneBtn) deleteSceneBtn.style.display = 'none';
      // Set editor title
      if (editorTitle) editorTitle.textContent = 'Edit Character';
      // Fill form with character data if present, otherwise clear
      if (characters[idx]) {
        if (characterNameInput) characterNameInput.value = characters[idx].name || '';
        if (characterGenderInput) characterGenderInput.value = characters[idx].gender || '';
        if (characterBioGenderInput) characterBioGenderInput.value = characters[idx].bioGender || '';
        if (characterTagsInput) characterTagsInput.value = (characters[idx].tags || []).join(', ');
        // Initialize traits if not present
        if (!characters[idx].traits) {
          characters[idx].traits = [];
        }
        // Initialize variableValues if not present
        if (!characters[idx].variableValues) {
          characters[idx].variableValues = {};
          // Initialize with template defaults
      characterVariablesTemplate.forEach(templateVar => {
        if (!(templateVar.name in characters[idx].variableValues)) {
          characters[idx].variableValues[templateVar.name] = templateVar.defaultValue;
        }
      });
        }
        renderCharacterTraits();
        renderCharacterVariables();
        updateCharacterTraitSelect();
        // Re-render trait mechanics to update variable dropdowns
        renderTraitMechanics();
      }
      // Highlight selected
      renderCharacters();
    }

    function selectScene(path) {
      // Find parent scene index for Return button
      if (path && path.length === 1) {
        currentParentSceneIdx = findParentSceneIdx(path[0]);
      } else {
        currentParentSceneIdx = null;
      }
      selectedScenePath = path;
      // Hide character editor when a scene is selected
      if (characterEditor) characterEditor.style.display = 'none';
      const deleteCharacterBtnEl = document.getElementById('delete-character-btn');
      if (deleteCharacterBtnEl) deleteCharacterBtnEl.style.display = 'none';
      // Show scene editor (if present)
      const sceneEditor = editorContent.querySelector('.scene-form');
      if (sceneEditor && sceneEditor !== characterEditor) sceneEditor.style.display = 'block';
      renderSidebar();
      renderEditor();
    }

    function renderEditor() {
      const previewColumn = document.getElementById('preview-column');
      const editorContentDiv = document.getElementById('editor-content');
      if (!selectedScenePath || selectedScenePath.length !== 1) {
        if (previewColumn) previewColumn.innerHTML = '';
        if (editorContentDiv) editorContentDiv.innerHTML = `
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
      // Render preview in left column
      const conditionSummaryHtml = formatConditionSummary(scene.conditions);
      const inventorySummaryText = escapeHtml(getInventorySummaryText());
      if (previewColumn) previewColumn.innerHTML = `
        <div class="scene-preview">
          <div style="font-weight:bold;font-size:1.2em;margin-bottom:0.5em;color:var(--color-text);">${scene.title || `Scene ${idx + 1}`}</div>
          <div style="margin-bottom:1em;white-space:pre-line;max-width:600px;color:var(--color-text);">${scene.text || ''}</div>
          <div style="margin-bottom:0.5em;font-weight:600;color:var(--color-text);">Choices:</div>
          <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;" id="scene-preview-choices">
            ${(scene.choices||[]).map((choice) => {
              const choiceLabel = escapeHtml(choice.text || '(No text)');
              const conditional = hasConditions(choice);
              if (typeof choice.target === 'number' && scenes[choice.target]) {
                const bgColor = conditional ? 'var(--color-choice-conditional-bg)' : 'var(--color-choice-bg)';
                const borderStyle = conditional ? '2px solid var(--color-accent)' : '1px solid var(--color-border)';
                return `<button type='button' class='preview-choice-btn${conditional ? ' preview-choice-btn--conditional' : ''}' data-target='${choice.target}' style='margin-bottom:0.3em;padding:0.4em 1.2em;border-radius:6px;border:${borderStyle};background:${bgColor};color:var(--color-text);cursor:pointer;font-size:1em;position:relative;'>${choiceLabel}${conditional ? "<span class='preview-choice-badge'>Conditional</span>" : ''}</button>`;
              } else {
                const bgColor = conditional ? 'var(--color-choice-conditional-bg)' : 'var(--color-bg)';
                const borderStyle = conditional ? '2px dashed var(--color-accent)' : '1px solid var(--color-border)';
                const textColor = conditional ? 'var(--color-text)' : 'var(--color-muted)';
                return `<button type='button' disabled class='preview-choice-btn preview-choice-btn--disabled${conditional ? ' preview-choice-btn--conditional' : ''}' style='margin-bottom:0.3em;padding:0.4em 1.2em;border-radius:6px;border:${borderStyle};background:${bgColor};color:${textColor};cursor:not-allowed;font-size:1em;position:relative;'>${choiceLabel}${conditional ? "<span class='preview-choice-badge'>Conditional</span>" : ''}</button>`;
              }
            }).join('')}
          </div>
          <button id="preview-return-btn" style="margin-top:1.5em;padding:0.5em 1.5em;border-radius:6px;border:1px solid var(--color-border);background:var(--color-bg);color:var(--color-text);cursor:pointer;font-size:1em;">Return</button>
          <div id="scene-preview-conditions" style="margin-top:1em;color:var(--color-muted);font-size:0.95em;">${conditionSummaryHtml}</div>
          <div id="scene-preview-inventory" class="scene-preview-inventory">
            <span class="scene-preview-inventory-label">Inventory:</span>
            <span id="inventory-summary-text">${inventorySummaryText}</span>
          </div>
        </div>
      `;
      // Render editor form in right column
      if (editorContentDiv) editorContentDiv.innerHTML = `
        <div class="scene-form scrollable-panel">
          <div class="form-group">
            <label class="form-label">Scene Title</label>
            <input type="text" class="form-input" id="scene-title-input" value="${scene.title || ''}" placeholder="Enter scene title...">
          </div>
          <div class="form-group">
            <label class="form-label">Scene Text</label>
            <textarea class="form-textarea" id="scene-text-input" placeholder="Enter the scene text...">${scene.text || ''}</textarea>
          </div>
          <div class="choices-section">
            <div class="choices-header">
            <div class="choices-title">Choices</div>
              <div class="choices-subtitle">Add branching options and configure their availability, effects, and targets.</div>
            </div>
            <div id="choices-list">
              ${renderChoices(scene, idx)}
            </div>
            <button class="add-choice-btn" onclick="addChoice()">+ Add Choice</button>
          </div>
        </div>
      `;
      // Add event listener for preview return button
      setTimeout(() => {
        const returnBtn = document.getElementById('preview-return-btn');
        if (returnBtn) {
          returnBtn.addEventListener('click', () => {
            if (currentParentSceneIdx !== null) {
              selectScene([currentParentSceneIdx]);
            }
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
                if (typeof selectedScenePath !== 'undefined' && selectedScenePath && selectedScenePath.length === 1) {
                  previewSceneHistory.push(selectedScenePath[0]);
                }
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
      titleInput.addEventListener('input', (e) => {
        scene.title = e.target.value;
        // Update preview title live
        const previewTitle = previewColumn.querySelector('.scene-preview > div:first-child');
        if (previewTitle) {
          previewTitle.textContent = scene.title || `Scene ${idx + 1}`;
        }
        renderSidebar();
      });
      textInput.addEventListener('input', (e) => {
        scene.text = e.target.value;
        // Update preview text live
        const previewText = previewColumn.querySelector('.scene-preview > div:nth-child(2)');
        if (previewText) {
          previewText.textContent = scene.text || '';
        }
      });
      // Choices are edited via the popup editor; no inline listeners required here.
      updateInventoryPreviewSummary();
    }

    function renderSceneConditionBuilder(scene) {
      const container = document.getElementById('scene-condition-builder');
      if (!container) return;
      const state = getConditionState(scene);
      container.innerHTML = '';
      renderConditionBuilderUI(scene, container, state, {
        stateKey: '__conditionState',
        onConditionsChanged: () => updateScenePreviewConditions(scene)
      });
      syncEntityConditions(scene);
      updateScenePreviewConditions(scene);
    }

    function getConditionState(entity, options = {}) {
      const stateKey = options.stateKey || '__conditionState';
      const getConditions = options.getConditions || (target => target.conditions);
      if (!entity[stateKey]) {
        const state = { mode: 'builder', rules: [], rawText: '', lastError: null };
        const conds = getConditions(entity);
        if (conds) {
          if (conds && Array.isArray(conds.rules)) {
            state.mode = 'builder';
            state.rules = cloneConditionRules(conds.rules);
          } else if (Array.isArray(conds)) {
            state.mode = 'builder';
            state.rules = cloneConditionRules(conds);
          } else if (typeof conds === 'object') {
            const legacyRules = convertLegacyConditionsToRules(conds);
            if (legacyRules.length) {
              state.mode = 'builder';
              state.rules = legacyRules;
            } else {
              state.mode = 'advanced';
              state.rawText = JSON.stringify(conds, null, 2);
            }
          } else if (typeof conds === 'string') {
            state.mode = 'advanced';
            state.rawText = conds;
          }
        }
        entity[stateKey] = state;
      }
      return entity[stateKey];
    }

    function syncEntityConditions(entity, options = {}) {
      const stateKey = options.stateKey || '__conditionState';
      const setConditions = options.setConditions || ((target, value) => {
        target.conditions = value;
      });
      const state = entity[stateKey];
      if (!state) return;
      if (state.mode === 'builder') {
        const nextConditions = serializeRulesToConditions(state.rules);
        setConditions(entity, nextConditions);
        state.rawText = nextConditions ? JSON.stringify(nextConditions, null, 2) : '';
        state.lastError = null;
      } else {
        try {
          const parsed = state.rawText && state.rawText.trim() ? JSON.parse(state.rawText) : undefined;
          setConditions(entity, parsed);
          state.lastError = null;
        } catch (err) {
          state.lastError = err.message;
        }
      }
    }

    function syncSceneConditions(scene) {
      syncEntityConditions(scene);
    }

    function updateScenePreviewConditions(scene) {
      const previewEl = document.getElementById('scene-preview-conditions');
      if (previewEl) {
        previewEl.innerHTML = formatConditionSummary(scene.conditions);
      }
    }

    function getConditionVariableOptions() {
      const options = [];
      (globalVariables || []).forEach(variable => {
        if (!variable || !variable.name) return;
        options.push({
          scope: 'global',
          name: variable.name,
          valueType: mapVariableTypeToConditionType(variable.type)
        });
      });
      (characterVariablesTemplate || []).forEach(variable => {
        if (!variable || !variable.name) return;
        options.push({
          scope: 'character',
          name: variable.name,
          valueType: mapVariableTypeToConditionType(variable.type)
        });
      });
      return options;
    }

    function mapVariableTypeToConditionType(inputType) {
      if (!inputType) return 'string';
      const type = inputType.toLowerCase();
      if (type === 'integer' || type === 'int') return 'integer';
      if (type === 'float' || type === 'number' || type === 'double') return 'float';
      if (type === 'boolean' || type === 'bool') return 'boolean';
      if (type === 'array' || type === 'list') return 'array';
      return 'string';
    }

    function getGlobalVariableDefinitions() {
      return (globalVariables || []).filter(variable => variable && variable.name).map(variable => ({
        name: variable.name,
        type: variable.type || 'string'
      }));
    }

    function getCharacterVariableDefinitions() {
      return (characterVariablesTemplate || []).filter(variable => variable && variable.name).map(variable => ({
        name: variable.name,
        type: variable.type || 'string'
      }));
    }

    function getCharacterOptions() {
      return (characters || []).map((char, idx) => ({
        id: idx,
        name: char && char.name ? char.name : `Character ${idx + 1}`
      }));
    }

    function getConditionTypeLabel(type) {
      const normalized = (type || 'string').toLowerCase();
      switch (normalized) {
        case 'integer':
          return 'Integer';
        case 'float':
        case 'number':
          return 'Number';
        case 'boolean':
          return 'Boolean';
        case 'array':
          return 'List';
        default:
          return 'Text';
      }
    }

    function applyTypeDefaults(rule, newType) {
      if (!rule) return;
      const nextType = newType || 'string';
      const previousType = rule.valueType;
      rule.valueType = nextType;
      if (previousType === nextType) {
        return;
      }
      switch (rule.valueType) {
        case 'boolean':
          rule.value = true;
          break;
        case 'integer': {
          const parsed = parseInt(rule.value, 10);
          rule.value = Number.isNaN(parsed) ? 0 : parsed;
          break;
        }
        case 'float': {
          const parsed = parseFloat(rule.value);
          rule.value = Number.isNaN(parsed) ? 0 : parsed;
          break;
        }
        case 'array':
          if (!Array.isArray(rule.value)) {
            if (typeof rule.value === 'string') {
              rule.value = rule.value
                .split(',')
                .map(v => v.trim())
                .filter(Boolean);
            } else {
              rule.value = [];
            }
          }
          break;
        default:
          rule.value = rule.value !== undefined ? rule.value : '';
      }
    }

    function renderConditionBuilderUI(entity, container, state, options = {}) {
      const variableOptionsFactory = options.getVariableOptions || getConditionVariableOptions;
      container.innerHTML = '';
      const variableOptions = variableOptionsFactory();
      const stateKey = options.stateKey || '__conditionState';
      const getConditions = options.getConditions || (target => target.conditions);
      const setConditions = options.setConditions || ((target, value) => {
        target.conditions = value;
      });
      const syncFn = options.syncConditions || ((target) => syncEntityConditions(target, { stateKey, setConditions }));
      const onConditionsChanged = options.onConditionsChanged || (() => {});
      const emptyMessageText = options.emptyMessage || 'No conditions defined.';
      const scopeOptions = options.scopeOptions || ['global', 'character', 'scene'];
      const dataListId = options.datalistId || 'condition-variable-options';
      container.className = 'condition-builder';
      const toolbar = document.createElement('div');
      toolbar.className = 'condition-builder-toolbar';
      const modeToggle = document.createElement('button');
      modeToggle.type = 'button';
      modeToggle.className = 'btn-small';
      modeToggle.textContent = state.mode === 'builder' ? 'Switch to JSON Editor' : 'Switch to Visual Builder';
      modeToggle.addEventListener('click', () => {
        if (state.mode === 'builder') {
          state.mode = 'advanced';
          const current = getConditions(entity);
          state.rawText = current ? JSON.stringify(current, null, 2) : '';
        } else {
          try {
            const parsed = state.rawText && state.rawText.trim() ? JSON.parse(state.rawText) : undefined;
            if (parsed && Array.isArray(parsed.rules)) {
              state.rules = cloneConditionRules(parsed.rules);
              state.mode = 'builder';
              state.lastError = null;
            } else if (parsed && typeof parsed === 'object') {
              state.rules = convertLegacyConditionsToRules(parsed);
              state.mode = 'builder';
              state.lastError = null;
            } else {
              state.rules = [];
              state.mode = 'builder';
              state.lastError = null;
            }
          } catch (err) {
            state.lastError = err.message;
            onConditionsChanged(entity);
            syncFn(entity);
            renderConditionBuilderUI(entity, container, state, options);
            return;
          }
        }
        syncFn(entity);
        onConditionsChanged(entity);
        renderConditionBuilderUI(entity, container, state, options);
      });
      toolbar.appendChild(modeToggle);
      if (state.mode === 'builder') {
        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'btn-small btn-primary';
        addBtn.textContent = '+ Add Condition';
        addBtn.addEventListener('click', () => {
          state.rules.push(createEmptyConditionRule());
          syncFn(entity);
          onConditionsChanged(entity);
          renderConditionBuilderUI(entity, container, state, options);
        });
        toolbar.appendChild(addBtn);
      }
      container.appendChild(toolbar);

      const body = document.createElement('div');
      body.className = 'condition-builder-body';
      container.appendChild(body);

      if (state.mode === 'advanced') {
        const textarea = document.createElement('textarea');
        textarea.className = 'form-textarea';
        textarea.placeholder = '{"logic":"all","rules":[...]}';
        textarea.value = state.rawText || '';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'condition-builder-error';
        if (state.lastError) {
          errorDiv.textContent = state.lastError;
        }
        textarea.addEventListener('input', (e) => {
          state.rawText = e.target.value;
          try {
            const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : undefined;
            setConditions(entity, parsed);
            state.lastError = null;
            errorDiv.textContent = '';
          } catch (err) {
            state.lastError = err.message;
            errorDiv.textContent = err.message;
          }
          onConditionsChanged(entity);
        });
        body.appendChild(textarea);
        body.appendChild(errorDiv);
        return;
      }

      const list = document.createElement('div');
      list.className = 'condition-rule-list';
      body.appendChild(list);

      if (!state.rules.length) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'condition-empty-message';
        emptyEl.textContent = emptyMessageText;
        list.appendChild(emptyEl);
      }

      let dataList = document.getElementById(dataListId);
      if (!dataList) {
        dataList = document.createElement('datalist');
        dataList.id = dataListId;
        document.body.appendChild(dataList);
      }
      dataList.innerHTML = '';
      variableOptions.forEach(opt => {
        const optionEl = document.createElement('option');
        optionEl.value = opt.name;
        optionEl.label = `${opt.scope}: ${opt.name}`;
        dataList.appendChild(optionEl);
      });

      state.rules.forEach((rule, index) => {
        if (!rule.id) {
          rule.id = ++conditionRuleAutoIncrement;
        }
        const row = document.createElement('div');
        row.className = 'condition-rule-row';

        const scopeSelect = document.createElement('select');
        scopeSelect.className = 'condition-scope';
        scopeOptions.forEach(scope => {
          const opt = document.createElement('option');
          opt.value = scope;
          opt.textContent = scope.charAt(0).toUpperCase() + scope.slice(1);
          if ((rule.scope || 'global') === scope) opt.selected = true;
          scopeSelect.appendChild(opt);
        });
        scopeSelect.addEventListener('change', (e) => {
          const newScope = e.target.value;
          if (rule.scope !== newScope) {
            rule.scope = newScope;
            if (rule.scope !== 'character') {
              rule.characterId = null;
            }
            if (rule.scope === 'global' || rule.scope === 'character') {
              rule.variable = '';
              applyTypeDefaults(rule, 'string');
            }
          }
          syncFn(entity);
          onConditionsChanged(entity);
          renderConditionBuilderUI(entity, container, state, options);
        });

        const currentScope = rule.scope || 'global';
        let variableControl;
        let typeControl;

        if (currentScope === 'global') {
          const globalDefinitions = getGlobalVariableDefinitions();
          const select = document.createElement('select');
          select.className = 'condition-variable condition-variable--select';
          const placeholder = document.createElement('option');
          placeholder.value = '';
          placeholder.textContent = globalDefinitions.length ? 'Select variable...' : 'No global variables';
          if (!globalDefinitions.length) {
            placeholder.disabled = true;
            placeholder.selected = true;
          } else if (!rule.variable) {
            placeholder.selected = true;
            placeholder.disabled = true;
          } else {
            placeholder.disabled = true;
          }
          select.appendChild(placeholder);

          let matchedGlobalVariable = null;
          if (rule.variable && !globalDefinitions.find(def => def.name === rule.variable)) {
            const missingOption = document.createElement('option');
            missingOption.value = rule.variable;
            missingOption.textContent = `${rule.variable} (missing)`;
            missingOption.selected = true;
            missingOption.disabled = true;
            select.appendChild(missingOption);
          }

          globalDefinitions.forEach(def => {
            const option = document.createElement('option');
            option.value = def.name;
            option.textContent = def.name;
            if (rule.variable === def.name) {
              option.selected = true;
              matchedGlobalVariable = def;
            }
            select.appendChild(option);
          });
          if (!globalDefinitions.length) {
            select.disabled = true;
          }
          const resolvedType = matchedGlobalVariable
            ? mapVariableTypeToConditionType(matchedGlobalVariable.type)
            : (rule.valueType || 'string');
          if (matchedGlobalVariable && rule.valueType !== resolvedType) {
            rule.valueType = resolvedType;
          }
          select.addEventListener('change', (e) => {
            rule.variable = e.target.value;
            const selectedDef = globalDefinitions.find(def => def.name === rule.variable);
            if (selectedDef) {
              const nextType = mapVariableTypeToConditionType(selectedDef.type);
              applyTypeDefaults(rule, nextType);
            } else {
              applyTypeDefaults(rule, 'string');
            }
            syncFn(entity);
            onConditionsChanged(entity);
            renderConditionBuilderUI(entity, container, state, options);
          });
          variableControl = select;

          typeControl = document.createElement('div');
          typeControl.className = 'condition-type-display';
          typeControl.textContent = `Type: ${getConditionTypeLabel(rule.valueType || resolvedType)}`;
        } else if (currentScope === 'character') {
          const characterGroup = document.createElement('div');
          characterGroup.className = 'condition-character-group';

          const characterSelect = document.createElement('select');
          characterSelect.className = 'condition-character-select';
          const characterOptions = getCharacterOptions();
          const characterPlaceholder = document.createElement('option');
          characterPlaceholder.value = '';
          characterPlaceholder.textContent = characterOptions.length ? 'Select character...' : 'No characters available';
          if (characterOptions.length === 0) {
            characterPlaceholder.disabled = true;
            characterPlaceholder.selected = true;
          } else if (rule.characterId === null || typeof rule.characterId !== 'number' || !characterOptions.find(opt => opt.id === rule.characterId)) {
            characterPlaceholder.disabled = true;
            characterPlaceholder.selected = true;
          } else {
            characterPlaceholder.disabled = true;
          }
          characterSelect.appendChild(characterPlaceholder);
          characterOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.id;
            option.textContent = opt.name;
            if (rule.characterId === opt.id) option.selected = true;
            characterSelect.appendChild(option);
          });
          if (!characterOptions.length) {
            characterSelect.disabled = true;
          }
          characterSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            rule.characterId = val === '' ? null : parseInt(val, 10);
            if (rule.characterId === null) {
              rule.variable = '';
              applyTypeDefaults(rule, 'string');
            }
            syncFn(entity);
            onConditionsChanged(entity);
            renderConditionBuilderUI(entity, container, state, options);
          });

          const characterVarSelect = document.createElement('select');
          characterVarSelect.className = 'condition-variable condition-variable--select';
          const templateDefinitions = getCharacterVariableDefinitions();
          const variablePlaceholder = document.createElement('option');
          variablePlaceholder.value = '';
          variablePlaceholder.textContent = templateDefinitions.length ? 'Select variable...' : 'No character variables';
          if (templateDefinitions.length === 0 || rule.characterId === null || typeof rule.characterId !== 'number') {
            variablePlaceholder.selected = true;
            variablePlaceholder.disabled = true;
          } else if (!rule.variable) {
            variablePlaceholder.selected = true;
            variablePlaceholder.disabled = true;
          } else {
            variablePlaceholder.disabled = true;
          }
          characterVarSelect.appendChild(variablePlaceholder);

          let matchedCharacterVar = null;
          if (rule.variable && !templateDefinitions.find(def => def.name === rule.variable)) {
            const missingOption = document.createElement('option');
            missingOption.value = rule.variable;
            missingOption.textContent = `${rule.variable} (missing)`;
            missingOption.selected = true;
            missingOption.disabled = true;
            characterVarSelect.appendChild(missingOption);
          }

          templateDefinitions.forEach(def => {
            const option = document.createElement('option');
            option.value = def.name;
            option.textContent = def.name;
            if (rule.variable === def.name) {
              option.selected = true;
              matchedCharacterVar = def;
            }
            characterVarSelect.appendChild(option);
          });
          characterVarSelect.disabled = rule.characterId === null || typeof rule.characterId !== 'number' || !templateDefinitions.length;
          if (matchedCharacterVar) {
            const desiredType = mapVariableTypeToConditionType(matchedCharacterVar.type);
            if (rule.valueType !== desiredType) {
              rule.valueType = desiredType;
            }
          }
          characterVarSelect.addEventListener('change', (e) => {
            rule.variable = e.target.value;
            const selectedDef = templateDefinitions.find(def => def.name === rule.variable);
            if (selectedDef) {
              const nextType = mapVariableTypeToConditionType(selectedDef.type);
              applyTypeDefaults(rule, nextType);
            } else {
              applyTypeDefaults(rule, 'string');
            }
            syncFn(entity);
            onConditionsChanged(entity);
            renderConditionBuilderUI(entity, container, state, options);
          });

          characterGroup.appendChild(characterSelect);
          characterGroup.appendChild(characterVarSelect);
          variableControl = characterGroup;

          typeControl = document.createElement('div');
          typeControl.className = 'condition-type-display';
          typeControl.textContent = `Type: ${getConditionTypeLabel(rule.valueType)}`;
        } else {
        const variableInput = document.createElement('input');
        variableInput.className = 'condition-variable';
        variableInput.setAttribute('list', dataListId);
        variableInput.placeholder = 'Variable name';
        variableInput.value = rule.variable || '';
        variableInput.addEventListener('input', (e) => {
          rule.variable = e.target.value.trim();
          const suggestion = variableOptions.find(opt => opt.name === rule.variable);
          if (suggestion) {
            rule.scope = suggestion.scope;
              applyTypeDefaults(rule, suggestion.valueType || 'string');
            }
            syncFn(entity);
            onConditionsChanged(entity);
            renderConditionBuilderUI(entity, container, state, options);
          });
          variableControl = variableInput;

        const typeSelect = document.createElement('select');
        typeSelect.className = 'condition-type';
        const typeOptions = [
          { value: 'string', label: 'Text' },
          { value: 'integer', label: 'Integer' },
          { value: 'float', label: 'Number' },
          { value: 'boolean', label: 'Boolean' },
          { value: 'array', label: 'List' }
        ];
        typeOptions.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          if ((rule.valueType || 'string') === opt.value) option.selected = true;
          typeSelect.appendChild(option);
        });
        typeSelect.addEventListener('change', (e) => {
            applyTypeDefaults(rule, e.target.value);
            syncFn(entity);
            onConditionsChanged(entity);
            renderConditionBuilderUI(entity, container, state, options);
          });
          typeControl = typeSelect;
        }

        const operatorSelect = document.createElement('select');
        operatorSelect.className = 'condition-operator';
        const allowedOperators = CONDITION_OPERATORS.filter(op => {
          const typeKey = rule.valueType === 'integer' || rule.valueType === 'float' ? 'number' : rule.valueType;
          return !op.supports || op.supports.includes(typeKey || 'string');
        });
        allowedOperators.forEach(op => {
          const option = document.createElement('option');
          option.value = op.value;
          option.textContent = op.label;
          if (rule.operator === op.value) option.selected = true;
          operatorSelect.appendChild(option);
        });
        if (!allowedOperators.find(op => op.value === rule.operator)) {
          rule.operator = allowedOperators[0] ? allowedOperators[0].value : '==';
        }
        operatorSelect.addEventListener('change', (e) => {
          rule.operator = e.target.value;
          syncFn(entity);
          onConditionsChanged(entity);
          renderConditionBuilderUI(entity, container, state, options);
        });

        let valueControl;
        const operatorConfig = CONDITION_OPERATORS.find(op => op.value === rule.operator);
        const needsValue = !(operatorConfig && operatorConfig.valueOptional);
        if (!needsValue) {
          valueControl = document.createElement('div');
          valueControl.className = 'condition-value condition-value--disabled';
          valueControl.textContent = 'No value required';
        } else if (rule.valueType === 'boolean') {
          valueControl = document.createElement('select');
          valueControl.className = 'condition-value';
          ['true', 'false'].forEach(optValue => {
            const option = document.createElement('option');
            option.value = optValue;
            option.textContent = optValue === 'true' ? 'True' : 'False';
            const current = rule.value === true || rule.value === 'true' ? 'true' : 'false';
            if (current === optValue) option.selected = true;
            valueControl.appendChild(option);
          });
          valueControl.addEventListener('change', (e) => {
            rule.value = e.target.value === 'true';
            syncFn(entity);
            onConditionsChanged(entity);
          });
        } else if (rule.valueType === 'integer' || rule.valueType === 'float') {
          valueControl = document.createElement('input');
          valueControl.type = 'number';
          valueControl.className = 'condition-value';
          valueControl.value = rule.value !== undefined ? rule.value : '';
          if (rule.valueType === 'integer') {
            valueControl.step = '1';
          }
          valueControl.addEventListener('input', (e) => {
            const val = rule.valueType === 'integer' ? parseInt(e.target.value, 10) : parseFloat(e.target.value);
            rule.value = Number.isNaN(val) ? 0 : val;
            syncFn(entity);
            onConditionsChanged(entity);
          });
        } else if (rule.valueType === 'array') {
          valueControl = document.createElement('input');
          valueControl.type = 'text';
          valueControl.className = 'condition-value';
          valueControl.placeholder = 'item1, item2';
          valueControl.value = Array.isArray(rule.value) ? rule.value.join(', ') : '';
          valueControl.addEventListener('input', (e) => {
            rule.value = e.target.value
              .split(',')
              .map(v => v.trim())
              .filter(Boolean);
            syncFn(entity);
            onConditionsChanged(entity);
          });
        } else {
          valueControl = document.createElement('input');
          valueControl.type = 'text';
          valueControl.className = 'condition-value';
          valueControl.value = rule.value !== undefined ? rule.value : '';
          valueControl.placeholder = 'Value';
          valueControl.addEventListener('input', (e) => {
            rule.value = e.target.value;
            syncFn(entity);
            onConditionsChanged(entity);
          });
        }

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-small btn-danger';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
          state.rules.splice(index, 1);
          syncFn(entity);
          onConditionsChanged(entity);
          renderConditionBuilderUI(entity, container, state, options);
        });

        const controlsWrapper = document.createElement('div');
        controlsWrapper.className = 'condition-rule-inputs';
        controlsWrapper.appendChild(scopeSelect);
        controlsWrapper.appendChild(variableControl);
        controlsWrapper.appendChild(typeControl);
        controlsWrapper.appendChild(operatorSelect);
        controlsWrapper.appendChild(valueControl);
        controlsWrapper.appendChild(removeBtn);

        row.appendChild(controlsWrapper);
        list.appendChild(row);
      });
    }

    function evaluateConditionRule(rule, context = {}) {
      if (!rule || !rule.variable) return true;
      const scope = rule.scope || 'global';
      const variable = rule.variable;
      const valueType = rule.valueType || 'string';
      let leftValue;
      if (scope === 'character') {
        if (typeof rule.characterId === 'number' && Array.isArray(context.characters)) {
          const targetCharacter = context.characters[rule.characterId];
          if (targetCharacter) {
            if (targetCharacter.variableValues && Object.prototype.hasOwnProperty.call(targetCharacter.variableValues, variable)) {
              leftValue = targetCharacter.variableValues[variable];
            } else {
              leftValue = targetCharacter[variable];
            }
          }
        } else if (context.character) {
          if (context.character.variableValues && Object.prototype.hasOwnProperty.call(context.character.variableValues, variable)) {
            leftValue = context.character.variableValues[variable];
          } else {
            leftValue = context.character[variable];
          }
        }
      } else if (scope === 'scene') {
        leftValue = context.scene && context.scene[variable];
      } else {
        leftValue = context.global && Object.prototype.hasOwnProperty.call(context.global, variable)
          ? context.global[variable]
          : context[variable];
      }
      const operator = rule.operator || '==';
      if (operator === 'exists') {
        return leftValue !== undefined && leftValue !== null;
      }
      if (operator === 'not_exists') {
        return leftValue === undefined || leftValue === null;
      }
      let expectedValue = rule.value;
      if (valueType === 'boolean') {
        expectedValue = parseValueForType(expectedValue, 'boolean');
      } else if (valueType === 'integer') {
        expectedValue = parseValueForType(expectedValue, 'integer');
      } else if (valueType === 'float') {
        expectedValue = parseValueForType(expectedValue, 'float');
      } else if (valueType === 'array') {
        expectedValue = parseValueForType(expectedValue, 'array');
      } else {
        expectedValue = parseValueForType(expectedValue, 'string');
      }
      let leftComparable;
      if (leftValue === undefined || leftValue === null) {
        leftComparable = leftValue;
      } else if (valueType === 'boolean') {
        leftComparable = parseValueForType(leftValue, 'boolean');
      } else if (valueType === 'integer') {
        leftComparable = parseValueForType(leftValue, 'integer');
      } else if (valueType === 'float') {
        leftComparable = parseValueForType(leftValue, 'float');
      } else if (valueType === 'array') {
        leftComparable = Array.isArray(leftValue) ? leftValue : parseValueForType(leftValue, 'array');
      } else {
        leftComparable = parseValueForType(leftValue, 'string');
      }
      switch (operator) {
        case '!=':
          return leftComparable !== expectedValue;
        case '>':
          return Number(leftComparable) > Number(expectedValue);
        case '>=':
          return Number(leftComparable) >= Number(expectedValue);
        case '<':
          return Number(leftComparable) < Number(expectedValue);
        case '<=':
          return Number(leftComparable) <= Number(expectedValue);
        case 'includes':
          if (Array.isArray(leftComparable)) {
            if (Array.isArray(expectedValue)) {
              return expectedValue.every(val => leftComparable.includes(val));
            }
            return leftComparable.includes(expectedValue);
          }
          return String(leftComparable ?? '').includes(String(expectedValue ?? ''));
        case '==':
        default:
          if (valueType === 'float' || valueType === 'integer') {
            return Number(leftComparable) === Number(expectedValue);
          }
          return leftComparable === expectedValue;
      }
    }

    function hasConditions(entity) {
      if (!entity || !entity.conditions) return false;
      const conds = entity.conditions;
      if (Array.isArray(conds)) return conds.length > 0;
      if (conds && Array.isArray(conds.rules)) return conds.rules.length > 0;
      if (typeof conds === 'object') return Object.keys(conds).length > 0;
      return Boolean(conds);
    }

    function renderChoices(scene, sceneIdx) {
      if (!scene.choices || scene.choices.length === 0) {
        return '<p class="choices-empty">No choices yet. Add choices to create branching paths.</p>';
      }
      return scene.choices.map((choice, choiceIdx) => {
        const choiceText = choice.text ? escapeHtml(choice.text) : '(No text yet)';
        let targetLabel;
        if (typeof choice.target === 'number' && scenes[choice.target]) {
          const targetScene = scenes[choice.target];
          targetLabel = `Scene ${choice.target + 1}${targetScene.title ? ': ' + escapeHtml(targetScene.title) : ''}`;
        } else if (choice.target === null || choice.target === undefined || choice.target === '') {
          targetLabel = 'End story';
        } else {
          targetLabel = 'Unassigned target';
        }
        const conditional = hasConditions(choice);
        const conditionalBadge = conditional
          ? '<span class="choice-pill choice-pill--conditional">Conditional</span>'
          : '<span class="choice-pill">Always visible</span>';
        const effectsCount = Array.isArray(choice.effects) ? choice.effects.length : 0;
        const effectsLabel = effectsCount === 0
          ? 'No effects configured'
          : `${effectsCount} effect${effectsCount === 1 ? '' : 's'}`;
        const targetBadge = `<span class="choice-pill choice-pill--target">${targetLabel}</span>`;
        return `
        <div class="choice-item">
          <div class="choice-summary">
            <div class="choice-title">${choiceText}</div>
            <div class="choice-meta">
              ${targetBadge}
              <span class="choice-pill choice-pill--effects">${effectsLabel}</span>
              ${conditionalBadge}
            </div>
          </div>
          <div class="choice-actions">
            <button type="button" class="btn-small btn-primary" onclick="editChoice(${sceneIdx}, ${choiceIdx})">Edit</button>
            <button type="button" class="btn-small btn-danger" onclick="deleteChoice(${sceneIdx}, ${choiceIdx})">×</button>
          </div>
        </div>
        `;
      }).join('');
    }

    function ensureChoiceArray(scene) {
      if (!scene.choices) scene.choices = [];
      return scene.choices;
    }

    function createChoiceDraft(source) {
      const draft = {
        text: source && source.text ? source.text : '',
        target: source && typeof source.target === 'number' ? source.target : null,
        conditions: source && source.conditions ? JSON.parse(JSON.stringify(source.conditions)) : undefined,
        effects: []
      };
      const sourceEffects = Array.isArray(source && source.effects) ? source.effects : [];
      draft.effects = sourceEffects.map(effect => ({
        id: effect && effect.id ? effect.id : ++choiceEffectAutoIncrement,
        type: effect && effect.type ? effect.type : 'variable', // 'variable' or 'inventory'
        scope: effect && effect.scope ? effect.scope : 'global',
        characterId: effect && typeof effect.characterId === 'number' ? effect.characterId : null,
        variable: effect && effect.variable ? effect.variable : '',
        operation: effect && effect.operation ? effect.operation : 'set',
        value: effect && effect.value !== undefined ? effect.value : '',
        // Inventory-specific fields
        itemId: effect && typeof effect.itemId === 'number' ? effect.itemId : null,
        quantity: effect && typeof effect.quantity === 'number' ? effect.quantity : 1
      }));
      return draft;
    }

    function createEmptyChoiceEffect() {
      return {
        id: ++choiceEffectAutoIncrement,
        type: 'variable', // 'variable' or 'inventory'
        scope: 'global',
        characterId: null,
        variable: '',
        operation: 'set',
        value: '',
        // Inventory-specific fields
        itemId: null,
        quantity: 1
      };
    }

    function normalizeChoiceDraft(draft) {
      const normalized = {
        text: (draft.text || '').trim(),
        target: typeof draft.target === 'number' && !Number.isNaN(draft.target) ? draft.target : null
      };
      if (draft.conditions && hasConditions(draft)) {
        normalized.conditions = JSON.parse(JSON.stringify(draft.conditions));
      }
      if (Array.isArray(draft.effects) && draft.effects.length) {
        normalized.effects = draft.effects.map(effect => {
          const effectType = effect.type || 'variable';
          if (effectType === 'inventory') {
            // Inventory effect
            return {
              type: 'inventory',
              scope: (effect.scope && effect.scope !== 'global') ? effect.scope : 'player', // Default to 'player' if 'global' or missing
              characterId: effect.scope === 'character' && typeof effect.characterId === 'number' ? effect.characterId : null,
              operation: effect.operation || 'give', // 'give' or 'remove'
              itemId: typeof effect.itemId === 'number' ? effect.itemId : null,
              quantity: typeof effect.quantity === 'number' ? effect.quantity : 1
            };
          } else {
            // Variable effect
            return {
              type: 'variable',
              scope: effect.scope || 'global',
              characterId: effect.scope === 'character' && typeof effect.characterId === 'number' ? effect.characterId : null,
              variable: effect.variable || '',
              operation: effect.operation || 'set',
              value: effect.value !== undefined ? effect.value : ''
            };
          }
        }).filter(effect => {
          // Filter out invalid effects
          if (effect.type === 'inventory') {
            return effect.itemId !== null && effect.itemId !== undefined;
          } else {
            return effect.variable && effect.variable.trim() !== '';
          }
        });
        if (!normalized.effects.length) {
          delete normalized.effects;
        }
      }
      if (!normalized.conditions) {
        delete normalized.conditions;
      }
      return normalized;
    }

    function createSceneAfter(sceneIdx) {
      const insertAt = sceneIdx + 1;
            const newScene = { title: '', text: '', choices: [] };
            scenes.splice(insertAt, 0, newScene);
            scenes.forEach(scene => {
        if (scene && Array.isArray(scene.choices)) {
                scene.choices.forEach(choice => {
                  if (typeof choice.target === 'number' && choice.target >= insertAt) {
              choice.target += 1;
                  }
                });
              }
            });
            renderSidebar();
      renderEditor();
      return insertAt;
    }

    function populateChoiceTargetOptions(selectEl, sceneIdx, draft) {
      if (!selectEl) return;
      const optionsHtml = [
        `<option value="">End story</option>`,
        ...scenes.map((scene, idx) => `<option value="${idx}">Scene ${idx + 1}${scene.title ? ': ' + escapeHtml(scene.title) : ''}</option>`)
      ].join('');
      selectEl.innerHTML = optionsHtml;
      if (draft.target !== null && draft.target !== undefined && !Number.isNaN(draft.target)) {
        selectEl.value = String(draft.target);
      } else {
        selectEl.value = '';
      }
    }

    function renderChoiceEffectsEditor(draft) {
      const container = document.getElementById('choice-effects-list');
      if (!container) return;
      container.innerHTML = '';
      if (!Array.isArray(draft.effects) || draft.effects.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'choice-effects-empty';
        empty.textContent = 'No effects configured.';
        container.appendChild(empty);
        return;
      }
      draft.effects.forEach((effect, idx) => {
        const row = document.createElement('div');
        row.className = 'choice-effect-row';
        
        const effectType = effect.type || 'variable';

        // Effect type selector
        const typeSelect = document.createElement('select');
        typeSelect.className = 'choice-effect-type';
        typeSelect.style.marginRight = '0.5em';
        const typeOptions = [
          { value: 'variable', label: 'Variable' },
          { value: 'inventory', label: 'Inventory Item' }
        ];
        typeOptions.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt.value;
          option.textContent = opt.label;
          if (effectType === opt.value) option.selected = true;
          typeSelect.appendChild(option);
        });
        typeSelect.addEventListener('change', (e) => {
          effect.type = e.target.value;
          // Reset fields when switching types
          if (e.target.value === 'inventory') {
            effect.variable = '';
            effect.value = '';
            effect.itemId = null;
            effect.quantity = 1;
            effect.operation = 'give';
            // Default to 'player' scope for inventory effects
            if (effect.scope === 'global') {
              effect.scope = 'player';
            }
          } else {
            effect.itemId = null;
            effect.quantity = 1;
            effect.operation = 'set';
          }
          renderChoiceEffectsEditor(draft);
        });
        row.appendChild(typeSelect);

        const scopeSelect = document.createElement('select');
        scopeSelect.className = 'choice-effect-scope';
        scopeSelect.style.marginRight = '0.5em';
        // For inventory effects, exclude 'global' scope
        const availableScopes = effectType === 'inventory' 
          ? ['player', 'character'] 
          : ['global', 'character', 'player'];
        availableScopes.forEach(scope => {
          const option = document.createElement('option');
          option.value = scope;
          option.textContent = scope.charAt(0).toUpperCase() + scope.slice(1);
          if ((effect.scope || (effectType === 'inventory' ? 'player' : 'global')) === scope) option.selected = true;
          scopeSelect.appendChild(option);
        });
        scopeSelect.addEventListener('change', (e) => {
          effect.scope = e.target.value;
          if (effect.scope !== 'character') {
            effect.characterId = null;
          }
          renderChoiceEffectsEditor(draft);
        });
        row.appendChild(scopeSelect);

        const characterSelect = document.createElement('select');
        characterSelect.className = 'choice-effect-character';
        characterSelect.style.marginRight = '0.5em';
        if (characters.length === 0) {
          const placeholder = document.createElement('option');
          placeholder.value = '';
          placeholder.textContent = 'No characters defined';
          characterSelect.appendChild(placeholder);
          characterSelect.disabled = true;
        } else {
          characters.forEach((char, cIdx) => {
            const option = document.createElement('option');
            option.value = String(cIdx);
            option.textContent = char && char.name ? char.name : `Character ${cIdx + 1}`;
            if (effect.characterId === cIdx) option.selected = true;
            characterSelect.appendChild(option);
          });
          characterSelect.disabled = effect.scope !== 'character';
          if (effect.scope !== 'character') {
            characterSelect.classList.add('choice-effect-character--hidden');
          } else {
            characterSelect.classList.remove('choice-effect-character--hidden');
          }
        }
        characterSelect.addEventListener('change', (e) => {
          const val = e.target.value;
          effect.characterId = val === '' ? null : parseInt(val, 10);
        });
        if (effect.scope === 'character') {
          row.appendChild(characterSelect);
        }

        if (effectType === 'inventory') {
          // Inventory item effect UI
          const itemSelect = document.createElement('select');
          itemSelect.className = 'choice-effect-item';
          itemSelect.style.marginRight = '0.5em';
          const placeholderOption = document.createElement('option');
          placeholderOption.value = '';
          placeholderOption.textContent = 'Select item...';
          itemSelect.appendChild(placeholderOption);
          inventoryItems.forEach(item => {
            if (item && item.id !== undefined && item.name) {
              const option = document.createElement('option');
              option.value = String(item.id);
              option.textContent = item.name;
              if (effect.itemId === item.id) option.selected = true;
              itemSelect.appendChild(option);
            }
          });
          itemSelect.addEventListener('change', (e) => {
            effect.itemId = e.target.value ? parseInt(e.target.value, 10) : null;
          });
          row.appendChild(itemSelect);

          const operationSelect = document.createElement('select');
          operationSelect.className = 'choice-effect-operation';
          operationSelect.style.marginRight = '0.5em';
          const inventoryOps = [
            { value: 'give', label: 'Give' },
            { value: 'remove', label: 'Remove' }
          ];
          inventoryOps.forEach(op => {
            const option = document.createElement('option');
            option.value = op.value;
            option.textContent = op.label;
            if ((effect.operation || 'give') === op.value) option.selected = true;
            operationSelect.appendChild(option);
          });
          operationSelect.addEventListener('change', (e) => {
            effect.operation = e.target.value;
          });
          row.appendChild(operationSelect);

          const quantityInput = document.createElement('input');
          quantityInput.type = 'number';
          quantityInput.className = 'choice-effect-quantity';
          quantityInput.placeholder = 'Quantity';
          quantityInput.min = '1';
          quantityInput.value = effect.quantity !== undefined ? effect.quantity : 1;
          quantityInput.style.width = '80px';
          quantityInput.style.marginRight = '0.5em';
          quantityInput.addEventListener('input', (e) => {
            effect.quantity = parseInt(e.target.value, 10) || 1;
          });
          row.appendChild(quantityInput);
        } else {
          // Variable effect UI
          const variableInput = document.createElement('input');
          variableInput.type = 'text';
          variableInput.className = 'choice-effect-variable';
          variableInput.placeholder = 'Variable name';
          variableInput.value = effect.variable || '';
          variableInput.style.marginRight = '0.5em';
          variableInput.addEventListener('input', (e) => {
            effect.variable = e.target.value;
          });
          row.appendChild(variableInput);

          const operationSelect = document.createElement('select');
          operationSelect.className = 'choice-effect-operation';
          operationSelect.style.marginRight = '0.5em';
          CHOICE_EFFECT_OPERATIONS.forEach(op => {
            const option = document.createElement('option');
            option.value = op.value;
            option.textContent = op.label;
            if ((effect.operation || 'set') === op.value) option.selected = true;
            operationSelect.appendChild(option);
          });
          operationSelect.addEventListener('change', (e) => {
            effect.operation = e.target.value;
          });
          row.appendChild(operationSelect);

          const valueInput = document.createElement('input');
          valueInput.type = 'text';
          valueInput.className = 'choice-effect-value';
          valueInput.placeholder = 'Value or formula';
          valueInput.value = effect.value !== undefined ? effect.value : '';
          valueInput.addEventListener('input', (e) => {
            effect.value = e.target.value;
          });
          row.appendChild(valueInput);
        }

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'btn-small btn-danger';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', () => {
          draft.effects.splice(idx, 1);
          renderChoiceEffectsEditor(draft);
        });
        row.appendChild(removeBtn);
        
        container.appendChild(row);
      });
    }

    function renderChoiceEditorModal(context) {
      if (!choiceEditorContent) return;
      const { draft, sceneIdx, isNew } = context;
      const heading = isNew ? 'Add Choice' : 'Edit Choice';
      choiceEditorContent.innerHTML = `
        <div class="choice-modal-header">
          <h2>${heading}</h2>
          <button type="button" class="choice-modal-close" id="choice-modal-close-btn">×</button>
        </div>
        <div class="choice-modal-body">
          <div class="choice-modal-section">
            <label class="choice-modal-label" for="choice-modal-text">Choice Text</label>
            <input type="text" id="choice-modal-text" class="form-input" placeholder="Describe the choice..." value="${escapeHtml(draft.text || '')}">
          </div>
          <div class="choice-modal-section">
            <label class="choice-modal-label" for="choice-modal-target">Target Scene</label>
            <div class="choice-target-row">
              <select id="choice-modal-target" class="form-input"></select>
              <button type="button" class="btn-small btn-primary" id="choice-modal-create-scene">Create New Scene</button>
            </div>
            <p class="choice-modal-hint">Select which scene this choice should lead to. Create a new scene if needed.</p>
          </div>
          <div class="choice-modal-section">
            <div class="choice-modal-section-heading">
              <h3>Availability Conditions</h3>
              <p>Define rules that control when this choice is shown to players.</p>
            </div>
            <div id="choice-condition-builder"></div>
          </div>
          <div class="choice-modal-section">
            <div class="choice-modal-section-heading">
              <h3>Effects</h3>
              <p>Apply changes to variables or characters when this choice is selected.</p>
            </div>
            <div id="choice-effects-list"></div>
            <button type="button" class="btn-small btn-secondary" id="choice-add-effect-btn">+ Add Effect</button>
          </div>
        </div>
        <div class="choice-modal-actions">
          <button type="button" class="action-btn" id="choice-save-btn">Save Choice</button>
          <button type="button" class="action-btn choice-cancel-btn" id="choice-cancel-btn">Cancel</button>
        </div>
      `;
      const textInput = document.getElementById('choice-modal-text');
      if (textInput) {
        textInput.addEventListener('input', (e) => {
          draft.text = e.target.value;
        });
        textInput.focus();
      }
      const targetSelect = document.getElementById('choice-modal-target');
      populateChoiceTargetOptions(targetSelect, sceneIdx, draft);
      if (targetSelect) {
        targetSelect.addEventListener('change', (e) => {
          const value = e.target.value;
          draft.target = value === '' ? null : parseInt(value, 10);
        });
      }
      const createSceneBtn = document.getElementById('choice-modal-create-scene');
      if (createSceneBtn) {
        createSceneBtn.addEventListener('click', () => {
          const newIdx = createSceneAfter(sceneIdx);
          draft.target = newIdx;
          populateChoiceTargetOptions(targetSelect, sceneIdx, draft);
          if (targetSelect) {
            targetSelect.value = String(newIdx);
          }
        });
      }
      const conditionContainer = document.getElementById('choice-condition-builder');
      if (conditionContainer) {
        const state = getConditionState(draft, { stateKey: '__choiceConditionState' });
        conditionContainer.innerHTML = '';
        renderConditionBuilderUI(draft, conditionContainer, state, {
          stateKey: '__choiceConditionState',
          emptyMessage: 'No conditions defined. Choice is always visible.',
          datalistId: 'choice-condition-variable-options',
          syncConditions: (entity) => syncEntityConditions(entity, {
            stateKey: '__choiceConditionState',
            setConditions: (target, value) => {
              target.conditions = value;
            }
          }),
          onConditionsChanged: () => {}
        });
      }
      renderChoiceEffectsEditor(draft);
      const addEffectBtn = document.getElementById('choice-add-effect-btn');
      if (addEffectBtn) {
        addEffectBtn.addEventListener('click', () => {
          if (!Array.isArray(draft.effects)) {
            draft.effects = [];
          }
          draft.effects.push(createEmptyChoiceEffect());
          renderChoiceEffectsEditor(draft);
        });
      }
      const saveBtn = document.getElementById('choice-save-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', handleChoiceSave);
      }
      const cancelBtn = document.getElementById('choice-cancel-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', closeChoiceEditor);
      }
      const closeBtn = document.getElementById('choice-modal-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', closeChoiceEditor);
      }
    }

    function openChoiceEditor(sceneIdx, choiceIdx = null) {
      if (!choiceEditorModal || !choiceEditorContent) return;
      const scene = scenes[sceneIdx];
      if (!scene) return;
      const choices = ensureChoiceArray(scene);
      const isNew = choiceIdx === null || choiceIdx === undefined || choiceIdx < 0 || !choices[choiceIdx];
      const sourceChoice = !isNew ? choices[choiceIdx] : null;
      const draft = createChoiceDraft(sourceChoice);
      activeChoiceContext = { sceneIdx, choiceIdx, isNew, draft };
      choiceEditorModal.classList.add('active');
      renderChoiceEditorModal(activeChoiceContext);
    }

    function closeChoiceEditor() {
      if (choiceEditorModal) {
        choiceEditorModal.classList.remove('active');
      }
      if (choiceEditorContent) {
        choiceEditorContent.innerHTML = '';
      }
      activeChoiceContext = null;
    }

    function handleChoiceSave() {
      if (!activeChoiceContext) {
        closeChoiceEditor();
        return;
      }
      const { sceneIdx, choiceIdx, isNew, draft } = activeChoiceContext;
      const scene = scenes[sceneIdx];
      if (!scene) {
        closeChoiceEditor();
        return;
      }
      ensureChoiceArray(scene);
      syncEntityConditions(draft, {
        stateKey: '__choiceConditionState',
        setConditions: (target, value) => {
          target.conditions = value;
        }
      });
      const normalized = normalizeChoiceDraft(draft);
      if (isNew) {
        scene.choices.push(normalized);
      } else if (scene.choices[choiceIdx]) {
        scene.choices[choiceIdx] = normalized;
      } else {
        scene.choices.push(normalized);
      }
      closeChoiceEditor();
      renderSidebar();
      renderEditor();
    }

    if (choiceEditorModal) {
      choiceEditorModal.addEventListener('click', (e) => {
        if (e.target === choiceEditorModal) {
          closeChoiceEditor();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && choiceEditorModal && choiceEditorModal.classList.contains('active')) {
        closeChoiceEditor();
      }
    });

    window.addChoice = function() {
      if (!selectedScenePath || selectedScenePath.length !== 1) return;
      const sceneIdx = selectedScenePath[0];
      openChoiceEditor(sceneIdx, null);
    };

    window.editChoice = function(sceneIdx, choiceIdx) {
      openChoiceEditor(sceneIdx, choiceIdx);
    };

    window.deleteChoice = function(sceneIdx, choiceIdx) {
      const scene = scenes[sceneIdx];
      if (!scene || !scene.choices) return;
      if (activeChoiceContext && activeChoiceContext.sceneIdx === sceneIdx && activeChoiceContext.choiceIdx === choiceIdx) {
        closeChoiceEditor();
      }
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

    // Helper: recursively find all descendant scene indices of a given scene
    function findDescendantScenes(startIdx, visited = new Set()) {
      if (visited.has(startIdx)) return;
      visited.add(startIdx);
      const scene = scenes[startIdx];
      if (scene && Array.isArray(scene.choices)) {
        scene.choices.forEach(choice => {
          if (typeof choice.target === 'number' && !visited.has(choice.target)) {
            findDescendantScenes(choice.target, visited);
          }
        });
      }
      return visited;
    }

    // Update deleteSceneBtn event handler
    deleteSceneBtn.addEventListener('click', () => {
      if (!selectedScenePath || selectedScenePath.length !== 1) return;
      const idx = selectedScenePath[0];
      if (!confirm('Delete this scene and all its child scenes?')) return;
      // Find all descendants (including the scene itself)
      const toDelete = Array.from(findDescendantScenes(idx));
      // Sort descending so we can safely splice
      toDelete.sort((a, b) => b - a);
      toDelete.forEach(delIdx => {
        scenes.splice(delIdx, 1);
      });
      // Update all choice targets in remaining scenes
      scenes.forEach(scene => {
        if (scene.choices) {
          scene.choices.forEach(choice => {
            if (typeof choice.target === 'number') {
              // If the target was deleted, set to null
              if (toDelete.includes(choice.target)) {
                choice.target = null;
              } else {
                // Decrement target index for each deleted scene before it
                choice.target -= toDelete.filter(d => d < choice.target).length;
              }
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
  showNotification('Please enter a story title', 'error');
          return;
      }
      if (scenes.length === 0) {
        alert('Please add at least one scene');
  showNotification('Please add at least one scene', 'error');
        return;
      }
      try {
        const storyData = {
          scenes,
          characters,
          playerData,
          globalVariables,
          characterVariablesTemplate,
          traitMechanics,
          inventoryMode,
          inventoryEquipSlots,
          inventoryItems,
          inventoryAssignments
        };
        await window.__TAURI__.core.invoke('save_story', { title, storyJson: JSON.stringify(storyData) });
        currentStoryTitle = title;
        alert('Story saved successfully!');
  showNotification('Story saved successfully!', 'success');
      } catch (e) {
        alert('Failed to save story: ' + e);
  showNotification('Failed to save story: ' + e, 'error');
      }
    });

    cancelStoryBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });

    // Initialize the interface
    renderSidebar();
    renderEditor();
    setInventoryMode(inventoryMode);
    renderInventoryItemsList();
    renderEquipSlotsList();
    updateInventoryAddSelect();

    // --- Character List Logic ---
    function renderCharacters() {
      charactersList.innerHTML = '';
      
      // Add Player as the first item in the character list
      const playerLi = document.createElement('li');
      playerLi.className = 'scene-item scene-item--player';
      if (selectedCharacterIdx === 'player') playerLi.classList.add('active');
      playerLi.innerHTML = `
        <span class="scene-icon"></span>
        <span class="scene-title">Player</span>
      `;
      playerLi.addEventListener('click', () => {
        selectCharacter('player');
      });
      charactersList.appendChild(playerLi);
      
      // Add regular characters
      if (characters.length === 0) {
        charactersListEmpty.style.display = '';
      } else {
        charactersListEmpty.style.display = 'none';
        characters.forEach((char, idx) => {
          const li = document.createElement('li');
          li.className = 'scene-item';
          if (selectedCharacterIdx === idx) li.classList.add('active');
          li.innerHTML = `
            <span class="scene-icon"></span>
            <span class="scene-title">${char.name}</span>
          `;
          li.addEventListener('click', () => {
            selectCharacter(idx);
          });
          charactersList.appendChild(li);
        });
      }
      renderInventorySidebar();
    }

    function clearCharacterEditor() {
      selectedCharacterIdx = null;
      if (characterEditor) characterEditor.style.display = 'none';
      const emptyEditor = editorContent.querySelector('.empty-editor');
      if (emptyEditor) emptyEditor.style.display = '';
      const deleteCharacterBtnEl = document.getElementById('delete-character-btn');
      if (deleteCharacterBtnEl) deleteCharacterBtnEl.style.display = 'none';
      if (editorTitle) editorTitle.textContent = 'Select a scene to edit';
      // Show config section if Characters tab is active
      const tabCharacters = document.getElementById('tab-characters');
      const charactersConfigSection = document.getElementById('characters-config-section');
      const previewColumn = document.getElementById('preview-column');
      if (tabCharacters && tabCharacters.classList.contains('active')) {
        if (charactersConfigSection) charactersConfigSection.style.display = 'block';
        if (previewColumn) previewColumn.style.display = 'none';
      } else {
        if (charactersConfigSection) charactersConfigSection.style.display = 'none';
        if (previewColumn) previewColumn.style.display = 'flex';
      }
    }

    if (characterNameInput) {
      characterNameInput.addEventListener('input', (e) => {
        if (selectedCharacterIdx === 'player') {
          // Player name is fixed, don't allow editing
          e.target.value = 'Player';
          return;
        }
        if (selectedCharacterIdx !== null && characters[selectedCharacterIdx]) {
          characters[selectedCharacterIdx].name = e.target.value;
          renderCharacters();
        }
      });
    }
    if (characterGenderInput) {
      characterGenderInput.addEventListener('change', (e) => {
        if (selectedCharacterIdx === 'player') {
          // Player doesn't have gender stored, ignore
          return;
        }
        if (selectedCharacterIdx !== null && characters[selectedCharacterIdx]) {
          characters[selectedCharacterIdx].gender = e.target.value;
        }
      });
    }
    if (characterBioGenderInput) {
      characterBioGenderInput.addEventListener('change', (e) => {
        if (selectedCharacterIdx === 'player') {
          // Player doesn't have bio gender stored, ignore
          return;
        }
        if (selectedCharacterIdx !== null && characters[selectedCharacterIdx]) {
          characters[selectedCharacterIdx].bioGender = e.target.value;
        }
      });
    }
    if (characterTagsInput) {
      characterTagsInput.addEventListener('input', (e) => {
        if (selectedCharacterIdx === 'player') {
          // Player doesn't have tags stored, ignore
          return;
        }
        if (selectedCharacterIdx !== null && characters[selectedCharacterIdx]) {
          characters[selectedCharacterIdx].tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
        }
      });
    }
    if (deleteCharacterBtn) {
      deleteCharacterBtn.addEventListener('click', () => {
        if (selectedCharacterIdx === 'player') {
          // Cannot delete player
          return;
        }
        if (selectedCharacterIdx !== null && typeof selectedCharacterIdx === 'number') {
          characters.splice(selectedCharacterIdx, 1);
          clearCharacterEditor();
          renderCharacters();
        }
      });
    }
    if (addCharacterBtn) {
      addCharacterBtn.addEventListener('click', () => {
        const newChar = { name: '', gender: '', bioGender: '', tags: [], traits: [], variableValues: {} };
        // Initialize with template defaults
        characterVariablesTemplate.forEach(templateVar => {
          newChar.variableValues[templateVar.name] = templateVar.defaultValue;
        });
        characters.push(newChar);
        renderCharacters();
        selectCharacter(characters.length - 1);
      });
    }

    // Calculate trait effects on a character's variables
    function calculateTraitEffects(character) {
      if (!character || !character.traits || !character.variableValues) return {};
      
      const effects = {};
      const baseValues = { ...character.variableValues };
      
      // Apply trait mechanics
      character.traits.forEach(traitName => {
        const mechanic = traitMechanics.find(m => m.trait === traitName);
        if (mechanic && mechanic.active && mechanic.effects) {
          mechanic.effects.forEach(effect => {
            if (!effects[effect.variable]) {
              effects[effect.variable] = 0;
            }
            // Evaluate formula with current variable values
            try {
              const formula = effect.formula || '0';
              // Replace variable names with their values
              let evaluatedFormula = formula;
              Object.keys(baseValues).forEach(varName => {
                const value = baseValues[varName];
                if (typeof value === 'number') {
                  evaluatedFormula = evaluatedFormula.replace(new RegExp(`\\b${varName}\\b`, 'g'), value.toString());
                }
              });
              // Simple evaluation (for basic math operations)
              const result = Function('"use strict"; return (' + evaluatedFormula + ')')();
              effects[effect.variable] += result;
            } catch (e) {
              console.warn('Error evaluating trait formula:', e);
            }
          });
        }
      });
      
      return effects;
    }

    // Character Traits Management
    function renderCharacterTraits() {
      const characterTraitsList = document.getElementById('character-traits-list');
      const characterTraitInput = document.getElementById('character-trait-input');
      if (!characterTraitsList || selectedCharacterIdx === null) return;
      
      // Get character or player data
      const character = selectedCharacterIdx === 'player' 
        ? playerData 
        : characters[selectedCharacterIdx];
      if (!character || !character.traits) return;
      
      characterTraitsList.innerHTML = '';
      
      character.traits.forEach((trait, idx) => {
        const traitTag = document.createElement('span');
        traitTag.className = 'trait-tag';
        traitTag.style.cssText = `
          display: inline-block;
          background: var(--color-primary);
          color: var(--color-text-light);
          padding: 0.3em 0.8em;
          border-radius: 20px;
          font-size: 0.85em;
          margin: 0.3em 0.3em 0.3em 0;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s;
          position: relative;
        `;
        traitTag.title = 'Double-click to edit';

        const traitNameSpan = document.createElement('span');
        traitNameSpan.textContent = trait;
        traitTag.appendChild(traitNameSpan);

        const mechanic = traitMechanics.find(m => m.trait === trait);
        if (mechanic) {
          const statusSpan = document.createElement('span');
          statusSpan.textContent = mechanic.active ? '✔' : '✖';
          statusSpan.style.cssText = `
            margin-left: 0.4em;
            font-weight: 600;
            font-size: 0.85em;
          `;
          statusSpan.title = mechanic.active ? 'Active' : 'Inactive';
          traitTag.appendChild(statusSpan);

          const tooltipParts = [];
          if (mechanic.description) tooltipParts.push(mechanic.description);
          tooltipParts.push(`Status: ${mechanic.active ? 'Active' : 'Inactive'}`);
          if (mechanic.active && mechanic.usageCosts && mechanic.usageCosts.length) {
            mechanic.usageCosts.forEach(cost => {
              const resourceLabel = cost.resource ? cost.resource : null;
              const formulaLabel = cost.formula || '0';
              tooltipParts.push(resourceLabel ? `Usage Cost - ${resourceLabel}: ${formulaLabel}` : `Usage Cost: ${formulaLabel}`);
            });
          }
          if (mechanic.active && mechanic.conditions) tooltipParts.push(`Conditions: ${mechanic.conditions}`);
          tooltipParts.push('Double-click to edit');
          traitTag.title = tooltipParts.join('\n');

          if (!mechanic.active) {
            traitTag.style.background = 'var(--color-choice-bg)';
            traitTag.style.color = 'var(--color-text)';
            traitTag.style.opacity = '0.7';
          }
        }
        
        // Add delete button
        const deleteBtn = document.createElement('span');
        deleteBtn.innerHTML = ' ×';
        deleteBtn.style.cssText = `
          margin-left: 0.4em;
          font-weight: bold;
          cursor: pointer;
          opacity: 0.8;
        `;
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          if (selectedCharacterIdx === 'player') {
            removeCharacterTrait('player', idx);
          } else {
            removeCharacterTrait(selectedCharacterIdx, idx);
          }
        };
        traitTag.appendChild(deleteBtn);
        
        // Hover effect
        traitTag.onmouseenter = () => {
          if (mechanic && !mechanic.active) {
            traitTag.style.opacity = '0.9';
            return;
          }
          traitTag.style.background = 'var(--color-primary-dark)';
          traitTag.style.transform = 'scale(1.05)';
        };
        traitTag.onmouseleave = () => {
          if (mechanic && !mechanic.active) {
            traitTag.style.background = 'var(--color-choice-bg)';
            traitTag.style.opacity = '0.7';
            traitTag.style.transform = 'scale(1)';
            return;
          }
          traitTag.style.background = 'var(--color-primary)';
          traitTag.style.transform = 'scale(1)';
        };
        
        characterTraitsList.appendChild(traitTag);
      });
      
      // Update trait select dropdown
      updateCharacterTraitSelect();
    }

    function updateCharacterTraitSelect() {
      const characterTraitSelect = document.getElementById('character-trait-select');
      if (!characterTraitSelect || selectedCharacterIdx === null) return;
      
      // Get character or player data
      const character = selectedCharacterIdx === 'player' 
        ? playerData 
        : characters[selectedCharacterIdx];
      if (!character) return;
      
      // Clear and populate dropdown
      characterTraitSelect.innerHTML = '<option value="">Select a trait or skill to add...</option>';
      let optionCount = 0;

      traitMechanics.forEach((mechanic, mechanicIdx) => {
        const normalizedMechanic = normalizeTraitMechanic(mechanic);
        traitMechanics[mechanicIdx] = normalizedMechanic;
        if (!normalizedMechanic.trait || character.traits.includes(normalizedMechanic.trait)) {
          return;
        }

        const option = document.createElement('option');
        option.value = normalizedMechanic.trait;
        option.textContent = normalizedMechanic.active
          ? normalizedMechanic.trait
          : `${normalizedMechanic.trait} (inactive)`;
        option.setAttribute('data-active', normalizedMechanic.active ? 'true' : 'false');

        characterTraitSelect.appendChild(option);
        optionCount++;
      });

      characterTraitSelect.disabled = optionCount === 0;
    }

    // Add event listener for trait select dropdown
    const characterTraitSelect = document.getElementById('character-trait-select');
    if (characterTraitSelect) {
      characterTraitSelect.addEventListener('change', function(e) {
        const traitName = this.value;
        if (traitName && selectedCharacterIdx !== null) {
          const char = selectedCharacterIdx === 'player' 
            ? playerData 
            : characters[selectedCharacterIdx];
          if (char && !char.traits.includes(traitName)) {
            char.traits.push(traitName);
            renderCharacterTraits();
            renderCharacterVariables();
            updateCharacterTraitSelect(); // Update dropdown
          }
          this.value = ''; // Reset selection
        }
      });
    }

    window.removeCharacterTrait = function(charIdx, traitIdx) {
      if (charIdx === 'player') {
        if (playerData && playerData.traits) {
          playerData.traits.splice(traitIdx, 1);
          renderCharacterTraits();
          renderCharacterVariables(); // Re-render to show updated effects
          updateCharacterTraitSelect(); // Update dropdown
        }
      } else if (characters[charIdx] && characters[charIdx].traits) {
        characters[charIdx].traits.splice(traitIdx, 1);
        renderCharacterTraits();
        renderCharacterVariables(); // Re-render to show updated effects
        updateCharacterTraitSelect(); // Update dropdown
      }
    };


    // Character Variables Management - Shows template variables with character's values and trait effects
    function renderCharacterVariables() {
      const characterVariablesList = document.getElementById('character-variables-list');
      if (!characterVariablesList || selectedCharacterIdx === null) return;
      
      // Get character or player data
      const character = selectedCharacterIdx === 'player' 
        ? playerData 
        : characters[selectedCharacterIdx];
      if (!character) return;
      
      if (!character.variableValues) {
        character.variableValues = {};
      }
      
      characterVariablesList.innerHTML = '';
      
      if (characterVariablesTemplate.length === 0) {
        characterVariablesList.innerHTML = '<p style="color: #666; font-style: italic; padding: 0.5em;">No character variables template defined. Define variables in the Characters tab.</p>';
        return;
      }
      
      // Calculate trait effects
      const traitEffects = calculateTraitEffects(character);
      
      characterVariablesTemplate.forEach((templateVar, idx) => {
        const baseValue = character.variableValues[templateVar.name] !== undefined 
          ? character.variableValues[templateVar.name] 
          : templateVar.defaultValue;
        
        const effect = traitEffects[templateVar.name] || 0;
        const effectiveValue = (typeof baseValue === 'number' && typeof effect === 'number') 
          ? baseValue + effect 
          : baseValue;
        
        const variableDiv = document.createElement('div');
        variableDiv.className = 'choice-item';
        variableDiv.style.marginBottom = '0.5em';
        const effectText = effect !== 0 ? ` <span style="color: ${effect > 0 ? 'var(--color-success)' : 'var(--color-danger)'}; font-size: 0.85em;">(${effect > 0 ? '+' : ''}${effect})</span>` : '';
        variableDiv.innerHTML = `
          <label style="flex: 1; font-weight: 500; padding: 0.4em; color: var(--color-text);">${templateVar.name || 'Unnamed'} (${templateVar.type})${effectText}</label>
          <input type="text" class="choice-text character-variable-value" placeholder="Base Value" value="${baseValue !== undefined ? baseValue : ''}" data-char-idx="${selectedCharacterIdx === 'player' ? 'player' : selectedCharacterIdx}" data-var-name="${templateVar.name}" style="width: 120px;">
          <span style="width: 80px; text-align: center; color: var(--color-muted); font-size: 0.9em;">→ ${effectiveValue !== undefined ? effectiveValue : ''}</span>
        `;
        characterVariablesList.appendChild(variableDiv);
      });
      
      // Add event listeners for value changes
      characterVariablesList.querySelectorAll('.character-variable-value').forEach(input => {
        input.addEventListener('input', (e) => {
          const charIdxAttr = e.target.getAttribute('data-char-idx');
          const varName = e.target.getAttribute('data-var-name');
          const charIdx = charIdxAttr === 'player' ? 'player' : parseInt(charIdxAttr, 10);
          const templateVar = characterVariablesTemplate.find(v => v.name === varName);
          
          if (charIdx === 'player' && varName && playerData && playerData.variableValues && templateVar) {
            const value = e.target.value;
            const type = templateVar.type;
            if (type === 'integer') {
              playerData.variableValues[varName] = value === '' ? undefined : parseInt(value);
            } else if (type === 'float') {
              playerData.variableValues[varName] = value === '' ? undefined : parseFloat(value);
            } else {
              playerData.variableValues[varName] = value;
            }
            renderCharacterVariables(); // Re-render to show updated effects
          } else if (!isNaN(charIdx) && varName && characters[charIdx] && characters[charIdx].variableValues && templateVar) {
            const value = e.target.value;
            const type = templateVar.type;
            if (type === 'integer') {
              characters[charIdx].variableValues[varName] = value === '' ? undefined : parseInt(value);
            } else if (type === 'float') {
              characters[charIdx].variableValues[varName] = value === '' ? undefined : parseFloat(value);
            } else if (type === 'boolean') {
              characters[charIdx].variableValues[varName] = value === 'true' || value === '1';
            } else {
              characters[charIdx].variableValues[varName] = value;
            }
            renderCharacterVariables(); // Re-render to show updated effects
          }
        });
      });
    }

    // Trait Mechanics Management
    const traitMechanicsList = document.getElementById('trait-mechanics-list');
    const addTraitMechanicBtn = document.getElementById('add-trait-mechanic-btn');

    (function() {
      function renderTraitMechanics() {
        const traitMechanicsList = document.getElementById('trait-mechanics-list');
        if (!traitMechanicsList) return;
        traitMechanicsList.innerHTML = '';
        if (traitMechanics.length === 0) {
          traitMechanicsList.innerHTML = '<p style="color: #666; font-style: italic; padding: 0.5em; text-align: center;">No trait mechanics defined yet.</p>';
          return;
        }
        traitMechanics.forEach((mechanic, idx) => {
          const normalizedMechanic = normalizeTraitMechanic(mechanic);
          traitMechanics[idx] = normalizedMechanic;

          const card = document.createElement('div');
          card.className = 'trait-config-card';
          card.style.cssText = `
            background: var(--color-choice-bg);
            border: 1px solid var(--color-border);
            border-radius: 8px;
            padding: 1em 1.2em;
            margin-bottom: 0.75em;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          `;
          card.title = 'Double-click to edit';
          if (!normalizedMechanic.active) {
            card.style.opacity = '0.75';
          }

          card.ondblclick = () => openTraitEditorModal(idx);
          card.onmouseenter = () => {
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.18)';
          };
          card.onmouseleave = () => {
            card.style.transform = 'none';
            card.style.boxShadow = 'none';
          };

          const header = document.createElement('div');
          header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 0.75em;';

          const titleWrap = document.createElement('div');
          titleWrap.style.cssText = 'display: flex; align-items: center; gap: 0.6em; flex-wrap: wrap;';

          const titleSpan = document.createElement('span');
          titleSpan.textContent = normalizedMechanic.trait || 'Unnamed Trait or Skill';
          titleSpan.style.cssText = 'font-weight: 600; font-size: 1em; color: var(--color-text);';
          titleWrap.appendChild(titleSpan);

          const statusBadge = document.createElement('span');
          statusBadge.textContent = normalizedMechanic.active ? '✔ Active' : '✖ Inactive';
          statusBadge.style.cssText = normalizedMechanic.active
            ? 'color: var(--color-success); font-size: 0.85em;'
            : 'color: var(--color-muted); font-size: 0.85em;';
          statusBadge.setAttribute('aria-label', statusBadge.textContent);
          titleWrap.appendChild(statusBadge);

          header.appendChild(titleWrap);

          const deleteBtn = document.createElement('span');
          deleteBtn.innerHTML = '×';
          deleteBtn.style.cssText = `
            font-size: 1.2em;
            font-weight: bold;
            color: var(--color-danger);
            cursor: pointer;
            padding: 0 0.2em;
          `;
          deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteTraitMechanic(idx);
          };
          header.appendChild(deleteBtn);

          card.appendChild(header);

          if (normalizedMechanic.description) {
            const descriptionDiv = document.createElement('div');
            descriptionDiv.textContent = normalizedMechanic.description;
            descriptionDiv.style.cssText = 'margin-top: 0.5em; font-size: 0.9em; color: var(--color-muted); white-space: pre-wrap;';
            card.appendChild(descriptionDiv);
          }

          if (normalizedMechanic.active && ((normalizedMechanic.usageCosts && normalizedMechanic.usageCosts.length) || normalizedMechanic.conditions)) {
            const activeMeta = document.createElement('div');
            activeMeta.style.cssText = 'margin-top: 0.75em; display: grid; gap: 0.5em;';
            if (normalizedMechanic.usageCosts && normalizedMechanic.usageCosts.length) {
              const usageRow = document.createElement('div');
              usageRow.style.cssText = 'font-size: 0.85em; color: var(--color-text);';
              usageRow.innerHTML = '<strong style="font-size: 0.85em; color: var(--color-text);">Usage Cost:</strong>';
              const list = document.createElement('ul');
              list.style.cssText = 'margin: 0.35em 0 0 1.1em; padding: 0; color: var(--color-muted); font-size: 0.83em;';
              normalizedMechanic.usageCosts.forEach(cost => {
                const li = document.createElement('li');
                const resourceLabel = cost.resource ? cost.resource : '';
                const formulaLabel = cost.formula || '0';
                li.textContent = resourceLabel ? `${resourceLabel}: ${formulaLabel}` : formulaLabel;
                list.appendChild(li);
              });
              usageRow.appendChild(list);
              activeMeta.appendChild(usageRow);
            }
            if (normalizedMechanic.conditions) {
              const conditionRow = document.createElement('div');
              conditionRow.innerHTML = '<strong style="font-size: 0.85em; color: var(--color-text);">Conditions:</strong> <span style="font-size: 0.85em; color: var(--color-muted);">' + normalizedMechanic.conditions + '</span>';
              activeMeta.appendChild(conditionRow);
            }
            card.appendChild(activeMeta);
          }

          const effectsMeta = document.createElement('div');
          effectsMeta.style.cssText = 'margin-top: 0.75em; font-size: 0.8em; color: var(--color-muted); display: flex; align-items: center; gap: 0.4em;';
          const effectCount = normalizedMechanic.effects ? normalizedMechanic.effects.length : 0;
          effectsMeta.textContent = `${effectCount} effect${effectCount === 1 ? '' : 's'}`;
          card.appendChild(effectsMeta);

          traitMechanicsList.appendChild(card);
        });
      }
      window.renderTraitMechanics = renderTraitMechanics;
    })();

    let editingTraitMechanicIdx = null;
    const traitMechanicEditorModal = document.getElementById('trait-mechanic-editor-modal');
    const traitMechanicEditorNameInput = document.getElementById('trait-mechanic-editor-name');
    const traitMechanicEditorDescriptionInput = document.getElementById('trait-mechanic-editor-description');
    const traitMechanicEditorEffectsList = document.getElementById('trait-mechanic-editor-effects-list');
    const traitMechanicEditorAddEffectBtn = document.getElementById('trait-mechanic-editor-add-effect-btn');
    const traitMechanicEditorSaveBtn = document.getElementById('trait-mechanic-editor-save-btn');
    const traitMechanicEditorCancelBtn = document.getElementById('trait-mechanic-editor-cancel-btn');
    const traitMechanicEditorActiveInput = document.getElementById('trait-mechanic-editor-active');
    const traitMechanicEditorActiveFields = document.getElementById('trait-mechanic-editor-active-fields');
    const traitMechanicEditorUsageCostsList = document.getElementById('trait-mechanic-editor-usage-costs-list');
    const traitMechanicEditorAddCostBtn = document.getElementById('trait-mechanic-editor-add-cost-btn');
    const traitMechanicEditorConditionsInput = document.getElementById('trait-mechanic-editor-conditions');

    function updateTraitEditorActiveFieldsVisibility() {
      if (!traitMechanicEditorActiveFields) return;
      const isActive = traitMechanicEditorActiveInput ? traitMechanicEditorActiveInput.checked : false;
      traitMechanicEditorActiveFields.style.display = isActive ? '' : 'none';
      if (traitMechanicEditorConditionsInput) traitMechanicEditorConditionsInput.disabled = !isActive;
      if (traitMechanicEditorAddCostBtn) traitMechanicEditorAddCostBtn.disabled = !isActive;
      if (traitMechanicEditorUsageCostsList) {
        traitMechanicEditorUsageCostsList.querySelectorAll('select, input, button').forEach(el => {
          el.disabled = !isActive;
        });
      }
    }

    if (traitMechanicEditorActiveInput) {
      traitMechanicEditorActiveInput.addEventListener('change', updateTraitEditorActiveFieldsVisibility);
    }

    updateTraitEditorActiveFieldsVisibility();

    function openTraitEditorModal(mechanicIdx) {
      editingTraitMechanicIdx = mechanicIdx;
      
      if (!traitMechanics[mechanicIdx]) return;
      const mechanic = normalizeTraitMechanic(traitMechanics[mechanicIdx]);
      traitMechanics[mechanicIdx] = mechanic;
      
      // Fill form
      if (traitMechanicEditorNameInput) traitMechanicEditorNameInput.value = mechanic.trait || '';
      if (traitMechanicEditorDescriptionInput) traitMechanicEditorDescriptionInput.value = mechanic.description || '';
      if (traitMechanicEditorActiveInput) traitMechanicEditorActiveInput.checked = mechanic.active;
      if (traitMechanicEditorConditionsInput) traitMechanicEditorConditionsInput.value = mechanic.conditions || '';
      updateTraitEditorActiveFieldsVisibility();
      
      renderTraitMechanicEditorUsageCosts(mechanic);
      renderTraitMechanicEditorEffects(mechanic);
      
      // Show modal
      if (traitMechanicEditorModal) traitMechanicEditorModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }

    function renderTraitMechanicEditorUsageCosts(mechanic) {
      if (!traitMechanicEditorUsageCostsList || !mechanic) return;

      if (!mechanic.usageCosts) mechanic.usageCosts = [];

      traitMechanicEditorUsageCostsList.innerHTML = '';

      const availableResources = new Set(characterVariablesTemplate.map(v => v.name));

      mechanic.usageCosts.forEach((cost, idx) => {
        const resourceOptions = characterVariablesTemplate.map(v => `<option value="${v.name}" ${cost.resource === v.name ? 'selected' : ''}>${v.name}</option>`).join('');
        const extraOption = cost.resource && !availableResources.has(cost.resource)
          ? `<option value="${cost.resource}" selected>${cost.resource}</option>`
          : '';
        const costDiv = document.createElement('div');
        costDiv.className = 'choice-item';
        costDiv.style.marginBottom = '0.5em';
        costDiv.style.padding = '0.5em';
        costDiv.innerHTML = `
          <select class="choice-target trait-mechanic-editor-cost-resource" data-cost-idx="${idx}" style="width: 150px; margin-right: 0.5em;">
            <option value="">Select resource...</option>
            ${extraOption}
            ${resourceOptions}
          </select>
          <input type="text" class="choice-text trait-mechanic-editor-cost-formula" placeholder="Cost amount or formula" value="${cost.formula || ''}" data-cost-idx="${idx}" style="flex: 1;">
          <button class="btn-small btn-danger" onclick="deleteTraitMechanicEditorCost(${idx})">×</button>
        `;
        traitMechanicEditorUsageCostsList.appendChild(costDiv);
      });

      traitMechanicEditorUsageCostsList.querySelectorAll('.trait-mechanic-editor-cost-resource').forEach(select => {
        select.addEventListener('change', (e) => {
          const costIdx = parseInt(e.target.getAttribute('data-cost-idx'), 10);
          if (!isNaN(costIdx) && mechanic.usageCosts[costIdx]) {
            mechanic.usageCosts[costIdx].resource = e.target.value;
          }
        });
      });

      traitMechanicEditorUsageCostsList.querySelectorAll('.trait-mechanic-editor-cost-formula').forEach(input => {
        input.addEventListener('input', (e) => {
          const costIdx = parseInt(e.target.getAttribute('data-cost-idx'), 10);
          if (!isNaN(costIdx) && mechanic.usageCosts[costIdx]) {
            mechanic.usageCosts[costIdx].formula = e.target.value;
          }
        });
      });
    }

    function renderTraitMechanicEditorEffects(mechanic) {
      if (!traitMechanicEditorEffectsList || !mechanic) return;
      
      if (!mechanic.effects) mechanic.effects = [];
      
      traitMechanicEditorEffectsList.innerHTML = '';
      
      mechanic.effects.forEach((effect, idx) => {
        const effectDiv = document.createElement('div');
        effectDiv.className = 'choice-item';
        effectDiv.style.marginBottom = '0.5em';
        effectDiv.style.padding = '0.5em';
        effectDiv.innerHTML = `
          <select class="choice-target trait-mechanic-editor-effect-variable" data-effect-idx="${idx}" style="width: 150px; margin-right: 0.5em;">
            <option value="">Select variable...</option>
            ${characterVariablesTemplate.map(v => `<option value="${v.name}" ${effect.variable === v.name ? 'selected' : ''}>${v.name}</option>`).join('')}
          </select>
          <input type="text" class="choice-text trait-mechanic-editor-effect-formula" placeholder="Formula (e.g., 5, health*0.1)" value="${effect.formula || ''}" data-effect-idx="${idx}" style="flex: 1;">
          <button class="btn-small btn-danger" onclick="deleteTraitMechanicEditorEffect(${idx})">×</button>
        `;
        traitMechanicEditorEffectsList.appendChild(effectDiv);
      });
      
      // Add event listeners
      traitMechanicEditorEffectsList.querySelectorAll('.trait-mechanic-editor-effect-variable').forEach(select => {
        select.addEventListener('change', (e) => {
          const effectIdx = parseInt(e.target.getAttribute('data-effect-idx'), 10);
          if (!isNaN(effectIdx) && mechanic.effects[effectIdx]) {
            mechanic.effects[effectIdx].variable = e.target.value;
          }
        });
      });
      
      traitMechanicEditorEffectsList.querySelectorAll('.trait-mechanic-editor-effect-formula').forEach(input => {
        input.addEventListener('input', (e) => {
          const effectIdx = parseInt(e.target.getAttribute('data-effect-idx'), 10);
          if (!isNaN(effectIdx) && mechanic.effects[effectIdx]) {
            mechanic.effects[effectIdx].formula = e.target.value;
          }
        });
      });
    }

    window.deleteTraitMechanicEditorEffect = function(effectIdx) {
      if (editingTraitMechanicIdx !== null && traitMechanics[editingTraitMechanicIdx]) {
        const mechanic = traitMechanics[editingTraitMechanicIdx];
        if (mechanic.effects) {
          mechanic.effects.splice(effectIdx, 1);
          renderTraitMechanicEditorEffects(mechanic);
        }
      }
    };

    window.deleteTraitMechanicEditorCost = function(costIdx) {
      if (editingTraitMechanicIdx !== null && traitMechanics[editingTraitMechanicIdx]) {
        const mechanic = traitMechanics[editingTraitMechanicIdx];
        if (mechanic.usageCosts) {
          mechanic.usageCosts.splice(costIdx, 1);
          renderTraitMechanicEditorUsageCosts(mechanic);
        }
      }
    };

    if (traitMechanicEditorAddEffectBtn) {
      traitMechanicEditorAddEffectBtn.addEventListener('click', () => {
        if (editingTraitMechanicIdx !== null && traitMechanics[editingTraitMechanicIdx]) {
          const mechanic = traitMechanics[editingTraitMechanicIdx];
          if (!mechanic.effects) mechanic.effects = [];
          mechanic.effects.push({ variable: '', formula: '' });
          renderTraitMechanicEditorEffects(mechanic);
        }
      });
    }

    if (traitMechanicEditorAddCostBtn) {
      traitMechanicEditorAddCostBtn.addEventListener('click', () => {
        if (editingTraitMechanicIdx !== null && traitMechanics[editingTraitMechanicIdx]) {
          const mechanic = normalizeTraitMechanic(traitMechanics[editingTraitMechanicIdx]);
          traitMechanics[editingTraitMechanicIdx] = mechanic;
          if (!mechanic.usageCosts) mechanic.usageCosts = [];
          mechanic.usageCosts.push({ resource: '', formula: '' });
          renderTraitMechanicEditorUsageCosts(mechanic);
        }
      });
    }

    function closeTraitEditorModal() {
      if (traitMechanicEditorModal) traitMechanicEditorModal.style.display = 'none';
      document.body.style.overflow = '';
      editingTraitMechanicIdx = null;
      if (traitMechanicEditorActiveInput) traitMechanicEditorActiveInput.checked = true;
      if (traitMechanicEditorUsageCostsList) traitMechanicEditorUsageCostsList.innerHTML = '';
      if (traitMechanicEditorConditionsInput) traitMechanicEditorConditionsInput.value = '';
      updateTraitEditorActiveFieldsVisibility();
    }

    if (traitMechanicEditorCancelBtn) {
      traitMechanicEditorCancelBtn.addEventListener('click', closeTraitEditorModal);
    }

    if (traitMechanicEditorSaveBtn) {
      traitMechanicEditorSaveBtn.addEventListener('click', () => {
        if (editingTraitMechanicIdx === null) return;
        
        const mechanic = traitMechanics[editingTraitMechanicIdx];
        if (mechanic) {
          const newName = traitMechanicEditorNameInput.value.trim();
          const description = traitMechanicEditorDescriptionInput.value.trim();
          const oldName = mechanic.trait;
          const isActive = traitMechanicEditorActiveInput ? traitMechanicEditorActiveInput.checked : true;
          const conditionsValue = traitMechanicEditorConditionsInput ? traitMechanicEditorConditionsInput.value.trim() : '';
          
          // Update mechanic
          mechanic.trait = newName;
          mechanic.description = description;
          mechanic.active = isActive;
          mechanic.conditions = isActive ? conditionsValue : '';
          if (!Array.isArray(mechanic.usageCosts)) mechanic.usageCosts = [];
          if (!isActive) {
            mechanic.usageCosts = [];
          }
          traitMechanics[editingTraitMechanicIdx] = normalizeTraitMechanic(mechanic);
          
          // If name changed, update all characters that have this trait
          if (oldName && oldName !== newName) {
            characters.forEach(char => {
              if (char.traits) {
                const traitIdx = char.traits.indexOf(oldName);
                if (traitIdx !== -1) {
                  char.traits[traitIdx] = newName;
                }
              }
            });
            // Re-render character traits if a character is selected
            if (selectedCharacterIdx !== null) {
              renderCharacterTraits();
              updateCharacterTraitSelect();
            }
          } else if (newName && !oldName) {
            // New trait name - update dropdown
            if (selectedCharacterIdx !== null) {
              updateCharacterTraitSelect();
            }
          }
          
          // Re-render
          renderTraitMechanics();
          renderCharacterTraits();
          renderCharacterVariables();
          updateCharacterTraitSelect();
        }
        
        closeTraitEditorModal();
      });
    }

    // Close modal on outside click
    if (traitMechanicEditorModal) {
      traitMechanicEditorModal.addEventListener('click', (e) => {
        if (e.target === traitMechanicEditorModal) closeTraitEditorModal();
      });
    }

    function renderTraitMechanicEffects(mechanicIdx) {
      const effectsContainer = document.getElementById(`trait-mechanic-effects-${mechanicIdx}`);
      if (!effectsContainer || !traitMechanics[mechanicIdx]) return;
      
      const mechanic = normalizeTraitMechanic(traitMechanics[mechanicIdx]);
      traitMechanics[mechanicIdx] = mechanic;
      if (!mechanic.effects) mechanic.effects = [];
      
      effectsContainer.innerHTML = '';
      
      mechanic.effects.forEach((effect, effectIdx) => {
        const effectDiv = document.createElement('div');
        effectDiv.className = 'choice-item';
        effectDiv.style.marginBottom = '0.3em';
        effectDiv.style.padding = '0.4em';
        effectDiv.style.backgroundColor = 'var(--color-bg)';
        effectDiv.innerHTML = `
          <select class="choice-target trait-effect-variable" data-mechanic-idx="${mechanicIdx}" data-effect-idx="${effectIdx}" style="width: 120px; margin-right: 0.5em;">
            <option value="">Select variable...</option>
            ${characterVariablesTemplate.map(v => `<option value="${v.name}" ${effect.variable === v.name ? 'selected' : ''}>${v.name}</option>`).join('')}
          </select>
          <input type="text" class="choice-text trait-effect-formula" placeholder="Formula (e.g., 5, health*0.1)" value="${effect.formula || ''}" data-mechanic-idx="${mechanicIdx}" data-effect-idx="${effectIdx}" style="flex: 1;">
          <button class="btn-small btn-danger" onclick="deleteTraitMechanicEffect(${mechanicIdx}, ${effectIdx})">×</button>
        `;
        effectsContainer.appendChild(effectDiv);
      });
      
      // Add event listeners
      effectsContainer.querySelectorAll('.trait-effect-variable').forEach(select => {
        select.addEventListener('change', (e) => {
          const mechanicIdx = parseInt(e.target.getAttribute('data-mechanic-idx'), 10);
          const effectIdx = parseInt(e.target.getAttribute('data-effect-idx'), 10);
          if (!isNaN(mechanicIdx) && !isNaN(effectIdx) && traitMechanics[mechanicIdx] && traitMechanics[mechanicIdx].effects[effectIdx]) {
            traitMechanics[mechanicIdx].effects[effectIdx].variable = e.target.value;
            // Re-render character variables if a character is selected
            if (selectedCharacterIdx !== null) {
              renderCharacterVariables();
            }
          }
        });
      });
      
      effectsContainer.querySelectorAll('.trait-effect-formula').forEach(input => {
        input.addEventListener('input', (e) => {
          const mechanicIdx = parseInt(e.target.getAttribute('data-mechanic-idx'), 10);
          const effectIdx = parseInt(e.target.getAttribute('data-effect-idx'), 10);
          if (!isNaN(mechanicIdx) && !isNaN(effectIdx) && traitMechanics[mechanicIdx] && traitMechanics[mechanicIdx].effects[effectIdx]) {
            traitMechanics[mechanicIdx].effects[effectIdx].formula = e.target.value;
            // Re-render character variables if a character is selected
            if (selectedCharacterIdx !== null) {
              renderCharacterVariables();
            }
          }
        });
      });
    }


    window.addTraitMechanicEffect = function(mechanicIdx) {
      if (traitMechanics[mechanicIdx]) {
        if (!traitMechanics[mechanicIdx].effects) traitMechanics[mechanicIdx].effects = [];
        traitMechanics[mechanicIdx].effects.push({ variable: '', formula: '' });
        renderTraitMechanicEffects(mechanicIdx);
        // Re-render character variables if a character is selected
        if (selectedCharacterIdx !== null) {
          renderCharacterVariables();
        }
      }
    };

    window.deleteTraitMechanicEffect = function(mechanicIdx, effectIdx) {
      if (traitMechanics[mechanicIdx] && traitMechanics[mechanicIdx].effects) {
        traitMechanics[mechanicIdx].effects.splice(effectIdx, 1);
        renderTraitMechanicEffects(mechanicIdx);
        if (selectedCharacterIdx !== null) {
          renderCharacterVariables();
        }
      }
    };

    window.deleteTraitMechanic = function(mechanicIdx) {
      if (mechanicIdx >= 0 && mechanicIdx < traitMechanics.length) {
        const traitName = traitMechanics[mechanicIdx].trait;
        traitMechanics.splice(mechanicIdx, 1);
        
        // Remove trait from all characters
        if (traitName) {
          characters.forEach(char => {
            if (char.traits) {
              const traitIdx = char.traits.indexOf(traitName);
              if (traitIdx !== -1) {
                char.traits.splice(traitIdx, 1);
              }
            }
          });
        }
        
        // Close editor if it was open
        if (editingTraitMechanicIdx === mechanicIdx) {
          editingTraitMechanicIdx = null;
        } else if (editingTraitMechanicIdx !== null && editingTraitMechanicIdx > mechanicIdx) {
          editingTraitMechanicIdx--; // Adjust index if needed
        }
        
        renderTraitMechanics();
        if (selectedCharacterIdx !== null) {
          renderCharacterTraits();
          renderCharacterVariables();
          updateCharacterTraitSelect();
        }
      }
    };

    if (addTraitMechanicBtn) {
      addTraitMechanicBtn.addEventListener('click', () => {
        const newMechanic = normalizeTraitMechanic({ trait: '', description: '', effects: [] });
        traitMechanics.push(newMechanic);
        const newIdx = traitMechanics.length - 1;
        renderTraitMechanics();
        // Open editor modal for new trait
        openTraitEditorModal(newIdx);
        if (selectedCharacterIdx !== null) {
          updateCharacterTraitSelect();
        }
      });
    }

    // Character Variables Template Management
    const characterVariablesTemplateList = document.getElementById('character-variables-template-list');
    const addCharacterVariableTemplateBtn = document.getElementById('add-character-variable-template-btn');

    function renderCharacterVariablesTemplate() {
      if (!characterVariablesTemplateList) return;
      characterVariablesTemplateList.innerHTML = '';
      
      if (characterVariablesTemplate.length === 0) {
        characterVariablesTemplateList.innerHTML = '<p style="color: #666; font-style: italic; padding: 0.5em; text-align: center;">No variables in template yet.</p>';
        return;
      }
      
      characterVariablesTemplate.forEach((templateVar, idx) => {
        const variableDiv = document.createElement('div');
        variableDiv.className = 'choice-item';
        variableDiv.style.marginBottom = '0.5em';
        variableDiv.style.padding = '0.5em';
        variableDiv.innerHTML = `
          <input type="text" class="choice-text character-template-variable-name" placeholder="Variable name" value="${templateVar.name || ''}" data-var-idx="${idx}" style="flex: 1;">
          <select class="choice-target character-template-variable-type" data-var-idx="${idx}" style="width: 100px;">
            <option value="integer" ${templateVar.type === 'integer' ? 'selected' : ''}>Integer</option>
            <option value="float" ${templateVar.type === 'float' ? 'selected' : ''}>Float</option>
            <option value="boolean" ${templateVar.type === 'boolean' ? 'selected' : ''}>Boolean</option>
          </select>
          <input type="text" class="choice-text character-template-variable-default" placeholder="Default" value="${templateVar.defaultValue !== undefined ? templateVar.defaultValue : ''}" data-var-idx="${idx}" style="width: 80px;">
          <button class="btn-small btn-danger" onclick="deleteCharacterVariableTemplate(${idx})">×</button>
        `;
        characterVariablesTemplateList.appendChild(variableDiv);
      });
      
      // Add event listeners
      characterVariablesTemplateList.querySelectorAll('.character-template-variable-name').forEach(input => {
        input.addEventListener('input', (e) => {
          const varIdx = parseInt(e.target.getAttribute('data-var-idx'), 10);
          if (!isNaN(varIdx) && characterVariablesTemplate[varIdx]) {
            const oldName = characterVariablesTemplate[varIdx].name;
            const newName = e.target.value;
            characterVariablesTemplate[varIdx].name = newName;
            
            if (oldName && oldName !== newName) {
              // Rename: Update all character variableValues to use new name
              characters.forEach(char => {
                if (char.variableValues && oldName in char.variableValues) {
                  const value = char.variableValues[oldName];
                  delete char.variableValues[oldName];
                  if (newName) {
                    char.variableValues[newName] = value;
                  }
                }
              });
            } else if (newName && !oldName) {
              // New variable: Initialize for all characters with default value
              const templateVar = characterVariablesTemplate[varIdx];
              characters.forEach(char => {
                if (!char.variableValues) char.variableValues = {};
                if (!(newName in char.variableValues)) {
                  char.variableValues[newName] = templateVar.defaultValue;
                }
              });
            }
            
            // Re-render character variables if a character is selected
            if (selectedCharacterIdx !== null) {
              renderCharacterVariables();
            }
          }
        });
      });
      
      characterVariablesTemplateList.querySelectorAll('.character-template-variable-type').forEach(select => {
        select.addEventListener('change', (e) => {
          const varIdx = parseInt(e.target.getAttribute('data-var-idx'), 10);
          if (!isNaN(varIdx) && characterVariablesTemplate[varIdx]) {
            characterVariablesTemplate[varIdx].type = e.target.value;
          }
        });
      });
      
      characterVariablesTemplateList.querySelectorAll('.character-template-variable-default').forEach(input => {
        input.addEventListener('input', (e) => {
          const varIdx = parseInt(e.target.getAttribute('data-var-idx'), 10);
          if (!isNaN(varIdx) && characterVariablesTemplate[varIdx]) {
            const value = e.target.value;
            const type = characterVariablesTemplate[varIdx].type;
            if (type === 'integer') {
              characterVariablesTemplate[varIdx].defaultValue = value === '' ? undefined : parseInt(value);
            } else if (type === 'float') {
              characterVariablesTemplate[varIdx].defaultValue = value === '' ? undefined : parseFloat(value);
            } else if (type === 'boolean') {
              characterVariablesTemplate[varIdx].defaultValue = value === 'true' || value === '1';
            } else {
              characterVariablesTemplate[varIdx].defaultValue = value;
            }
            
            // Update all characters that don't have a custom value for this variable
            characters.forEach(char => {
              if (!char.variableValues) char.variableValues = {};
              const varName = characterVariablesTemplate[varIdx].name;
              if (varName && !(varName in char.variableValues)) {
                char.variableValues[varName] = characterVariablesTemplate[varIdx].defaultValue;
              }
            });
          }
        });
      });
    }

    window.deleteCharacterVariableTemplate = function(varIdx) {
      if (varIdx >= 0 && varIdx < characterVariablesTemplate.length) {
        const varName = characterVariablesTemplate[varIdx].name;
        // Remove from all characters
        characters.forEach(char => {
          if (char.variableValues && varName in char.variableValues) {
            delete char.variableValues[varName];
          }
        });
        characterVariablesTemplate.splice(varIdx, 1);
        renderCharacterVariablesTemplate();
        // Re-render character variables if a character is selected
        if (selectedCharacterIdx !== null) {
          renderCharacterVariables();
        }
      }
    };

    if (addCharacterVariableTemplateBtn) {
      addCharacterVariableTemplateBtn.addEventListener('click', () => {
        const newVar = { name: '', type: 'integer', defaultValue: undefined };
        characterVariablesTemplate.push(newVar);
        // Add to all existing characters with default value
        characters.forEach(char => {
          if (!char.variableValues) char.variableValues = {};
          // When name is set later, it will be initialized via the name input handler
        });
        renderCharacterVariablesTemplate();
        // Re-render trait mechanics to update variable dropdowns
        renderTraitMechanics();
      });
    }

    // Hide character editor by default
    if (characterEditor) characterEditor.style.display = 'none';
    renderCharacters();
    renderTraitMechanics();
    renderCharacterVariablesTemplate();

    // --- Global Variables Management ---
    let selectedGlobalVariableIdx = null;
    const globalVariablesList = document.getElementById('global-variables-list');
    const globalVariablesListEmpty = document.getElementById('global-variables-list-empty');
    const addGlobalVariableBtn = document.getElementById('add-global-variable-btn');

    function renderGlobalVariables() {
      if (!globalVariablesList) return;
      globalVariablesList.innerHTML = '';
      if (globalVariables.length === 0) {
        if (globalVariablesListEmpty) globalVariablesListEmpty.style.display = '';
      } else {
        if (globalVariablesListEmpty) globalVariablesListEmpty.style.display = 'none';
        globalVariables.forEach((variable, idx) => {
          const li = document.createElement('li');
          li.className = 'scene-item';
          if (selectedGlobalVariableIdx === idx) li.classList.add('active');
          li.innerHTML = `
            <span class="scene-icon"></span>
            <span class="scene-title">${variable.name || 'Unnamed Variable'}</span>
          `;
          li.addEventListener('click', () => {
            selectGlobalVariable(idx);
          });
          globalVariablesList.appendChild(li);
        });
      }
    }

    function selectGlobalVariable(idx) {
      selectedGlobalVariableIdx = idx;
      // Hide scene editor, show global variable editor
      const sceneEditor = editorContent.querySelector('.scene-form');
      if (sceneEditor && sceneEditor !== characterEditor) sceneEditor.style.display = 'none';
      if (characterEditor) characterEditor.style.display = 'none';
      const emptyEditor = editorContent.querySelector('.empty-editor');
      if (emptyEditor) emptyEditor.style.display = 'none';
      
      // Show global variable editor
      let globalVarEditor = document.getElementById('global-variable-editor');
      if (!globalVarEditor) {
        globalVarEditor = document.createElement('div');
        globalVarEditor.id = 'global-variable-editor';
        globalVarEditor.className = 'scene-form';
        editorContent.appendChild(globalVarEditor);
      }
      globalVarEditor.style.display = 'block';
      
      // Hide scene delete button, show global variable delete button
      if (deleteSceneBtn) deleteSceneBtn.style.display = 'none';
      const deleteCharacterBtnEl = document.getElementById('delete-character-btn');
      if (deleteCharacterBtnEl) deleteCharacterBtnEl.style.display = 'none';
      let deleteGlobalVarBtn = document.getElementById('delete-global-variable-btn');
      if (!deleteGlobalVarBtn) {
        deleteGlobalVarBtn = document.createElement('button');
        deleteGlobalVarBtn.id = 'delete-global-variable-btn';
        deleteGlobalVarBtn.className = 'btn-small btn-danger';
        deleteGlobalVarBtn.textContent = 'Delete Variable';
        deleteGlobalVarBtn.style.display = 'block';
        editorTitle.parentElement.appendChild(deleteGlobalVarBtn);
        deleteGlobalVarBtn.addEventListener('click', () => {
          if (selectedGlobalVariableIdx !== null) {
            globalVariables.splice(selectedGlobalVariableIdx, 1);
            selectedGlobalVariableIdx = null;
            renderGlobalVariables();
            globalVarEditor.style.display = 'none';
            if (emptyEditor) emptyEditor.style.display = '';
            if (editorTitle) editorTitle.textContent = 'Select a scene to edit';
            if (deleteGlobalVarBtn) deleteGlobalVarBtn.style.display = 'none';
          }
        });
      } else {
        deleteGlobalVarBtn.style.display = 'block';
      }
      
      // Set editor title
      if (editorTitle) editorTitle.textContent = 'Edit Global Variable';
      
      // Render variable editor
      const variable = globalVariables[idx];
      globalVarEditor.innerHTML = `
        <div class="form-group">
          <label class="form-label">Variable Name</label>
          <input type="text" class="form-input" id="global-variable-name-input" value="${variable.name || ''}" placeholder="Variable name...">
        </div>
        <div class="form-group">
          <label class="form-label">Variable Type</label>
          <select class="form-input" id="global-variable-type-input">
            <option value="integer" ${variable.type === 'integer' ? 'selected' : ''}>Integer</option>
            <option value="float" ${variable.type === 'float' ? 'selected' : ''}>Float</option>
            <option value="string" ${variable.type === 'string' ? 'selected' : ''}>String</option>
            <option value="boolean" ${variable.type === 'boolean' ? 'selected' : ''}>Boolean</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Default Value</label>
          <input type="text" class="form-input" id="global-variable-value-input" value="${variable.defaultValue !== undefined ? variable.defaultValue : ''}" placeholder="Default value...">
        </div>
      `;
      
      // Add event listeners
      const nameInput = document.getElementById('global-variable-name-input');
      const typeInput = document.getElementById('global-variable-type-input');
      const valueInput = document.getElementById('global-variable-value-input');
      
      if (nameInput) {
        nameInput.addEventListener('input', (e) => {
          if (selectedGlobalVariableIdx !== null && globalVariables[selectedGlobalVariableIdx]) {
            globalVariables[selectedGlobalVariableIdx].name = e.target.value;
            renderGlobalVariables();
          }
        });
      }
      
      if (typeInput) {
        typeInput.addEventListener('change', (e) => {
          if (selectedGlobalVariableIdx !== null && globalVariables[selectedGlobalVariableIdx]) {
            globalVariables[selectedGlobalVariableIdx].type = e.target.value;
          }
        });
      }
      
      if (valueInput) {
        valueInput.addEventListener('input', (e) => {
          if (selectedGlobalVariableIdx !== null && globalVariables[selectedGlobalVariableIdx]) {
            const value = e.target.value;
            const type = globalVariables[selectedGlobalVariableIdx].type;
            if (type === 'integer') {
              globalVariables[selectedGlobalVariableIdx].defaultValue = value === '' ? undefined : parseInt(value);
            } else if (type === 'float') {
              globalVariables[selectedGlobalVariableIdx].defaultValue = value === '' ? undefined : parseFloat(value);
            } else if (type === 'boolean') {
              globalVariables[selectedGlobalVariableIdx].defaultValue = value === 'true' || value === '1';
            } else {
              globalVariables[selectedGlobalVariableIdx].defaultValue = value;
            }
          }
        });
      }
      
      renderGlobalVariables();
    }

    if (addGlobalVariableBtn) {
      addGlobalVariableBtn.addEventListener('click', () => {
        globalVariables.push({ name: '', type: 'integer', defaultValue: undefined });
        renderGlobalVariables();
        selectGlobalVariable(globalVariables.length - 1);
      });
    }

    // Hide global variable editor by default
    renderGlobalVariables();

  }

  // --- Mechanics Template Editor Modal Logic ---
  let editingMechanicsTemplateIdx = null;
  const editorModal = document.getElementById('mechanics-template-editor-modal');
  const editorNameInput = document.getElementById('mechanics-template-name-input');
  const editorSaveBtn = document.getElementById('mechanics-template-save-btn');
  const editorCancelBtn = document.getElementById('mechanics-template-cancel-btn');

  function openMechanicsTemplateEditor(idx) {
    const templates = getMechanicsTemplates();
    if (idx == null || !templates[idx]) return;
    editingMechanicsTemplateIdx = idx;
    editorNameInput.value = templates[idx].name || '';
    editorModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    editorNameInput.focus();
  }
  function closeMechanicsTemplateEditor() {
    editorModal.classList.remove('active');
    document.body.style.overflow = '';
    editingMechanicsTemplateIdx = null;
  }
  if (editorCancelBtn) {
    editorCancelBtn.onclick = closeMechanicsTemplateEditor;
  }
  if (editorSaveBtn) {
    editorSaveBtn.onclick = function() {
      if (editingMechanicsTemplateIdx == null) return;
      const templates = getMechanicsTemplates();
      templates[editingMechanicsTemplateIdx].name = editorNameInput.value.trim();
      setMechanicsTemplates(templates);
      loadMechanicsTemplateList();
      closeMechanicsTemplateEditor();
    };
  }
  // Close modal on outside click
  if (editorModal) {
    editorModal.addEventListener('click', function(e) {
      if (e.target === editorModal) closeMechanicsTemplateEditor();
    });
  }

  // --- Mechanics Template Variable Management ---
  const variableTypes = [
    { value: 'integer', label: 'Integer' },
    { value: 'float', label: 'Float' },
    { value: 'string', label: 'String' },
    { value: 'boolean', label: 'Boolean' },
  ];
  const variablesTbody = document.getElementById('mechanics-template-variables-tbody');
  const addVariableBtn = document.getElementById('add-mechanics-variable-btn');

  function renderVariablesTable() {
    if (!variablesTbody) return;
    variablesTbody.innerHTML = '';
    const templates = getMechanicsTemplates();
    if (editingMechanicsTemplateIdx == null || !templates[editingMechanicsTemplateIdx]) return;
    const variables = templates[editingMechanicsTemplateIdx].variables || [];
    variables.forEach((variable, idx) => {
      const tr = document.createElement('tr');
      // Name
      const nameTd = document.createElement('td');
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = variable.name || '';
      nameInput.style.width = '95%';
      nameInput.oninput = (e) => {
        variable.name = e.target.value;
        saveVariablesToTemplate(variables);
      };
      nameTd.appendChild(nameInput);
      // Type
      const typeTd = document.createElement('td');
      const typeSelect = document.createElement('select');
      variableTypes.forEach(type => {
        const opt = document.createElement('option');
        opt.value = type.value;
        opt.textContent = type.label;
        if (variable.type === type.value) opt.selected = true;
        typeSelect.appendChild(opt);
      });
      typeSelect.onchange = (e) => {
        variable.type = e.target.value;
        // Reset range if not numeric
        if (variable.type !== 'integer' && variable.type !== 'float') {
          delete variable.min;
          delete variable.max;
        }
        saveVariablesToTemplate(variables);
        renderVariablesTable();
      };
      typeTd.appendChild(typeSelect);
      // Range
      const rangeTd = document.createElement('td');
      if (variable.type === 'integer' || variable.type === 'float') {
        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.value = variable.min ?? '';
        minInput.placeholder = 'Min';
        minInput.style.width = '45%';
        minInput.oninput = (e) => {
          variable.min = e.target.value === '' ? undefined : (variable.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value));
          saveVariablesToTemplate(variables);
        };
        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.value = variable.max ?? '';
        maxInput.placeholder = 'Max';
        maxInput.style.width = '45%';
        maxInput.style.marginLeft = '4%';
        maxInput.oninput = (e) => {
          variable.max = e.target.value === '' ? undefined : (variable.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value));
          saveVariablesToTemplate(variables);
        };
        rangeTd.appendChild(minInput);
        rangeTd.appendChild(maxInput);
      } else {
        rangeTd.textContent = '-';
      }
      // Formula
      const formulaTd = document.createElement('td');
      const formulaInput = document.createElement('input');
      formulaInput.type = 'text';
      formulaInput.value = variable.formula || '';
      formulaInput.placeholder = 'e.g. var1 + var2';
      formulaInput.style.width = '95%';
      formulaInput.oninput = (e) => {
        variable.formula = e.target.value;
        saveVariablesToTemplate(variables);
      };
      formulaTd.appendChild(formulaInput);
      // Actions
      const actionsTd = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'action-btn';
      deleteBtn.style.background = 'var(--color-danger)';
      deleteBtn.style.color = 'var(--color-text-light)';
      deleteBtn.style.borderColor = 'var(--color-danger)';
      deleteBtn.onclick = () => {
        variables.splice(idx, 1);
        saveVariablesToTemplate(variables);
        renderVariablesTable();
      };
      actionsTd.appendChild(deleteBtn);
      // Append all tds
      tr.appendChild(nameTd);
      tr.appendChild(typeTd);
      tr.appendChild(rangeTd);
      tr.appendChild(formulaTd);
      tr.appendChild(actionsTd);
      variablesTbody.appendChild(tr);
    });
  }
  function saveVariablesToTemplate(variables) {
    const templates = getMechanicsTemplates();
    if (editingMechanicsTemplateIdx == null || !templates[editingMechanicsTemplateIdx]) return;
    templates[editingMechanicsTemplateIdx].variables = variables;
    setMechanicsTemplates(templates);
  }
  if (addVariableBtn) {
    addVariableBtn.onclick = () => {
      const templates = getMechanicsTemplates();
      if (editingMechanicsTemplateIdx == null || !templates[editingMechanicsTemplateIdx]) return;
      if (!templates[editingMechanicsTemplateIdx].variables) templates[editingMechanicsTemplateIdx].variables = [];
      templates[editingMechanicsTemplateIdx].variables.push({ name: '', type: 'integer', min: undefined, max: undefined, formula: '' });
      setMechanicsTemplates(templates);
      renderVariablesTable();
    };
  }
  // --- Patch modal open/close to render variables ---
  const originalOpenMechanicsTemplateEditor = openMechanicsTemplateEditor;
  openMechanicsTemplateEditor = function(idx) {
    originalOpenMechanicsTemplateEditor(idx);
    // Ensure variables array exists
    const templates = getMechanicsTemplates();
    if (idx != null && templates[idx] && !templates[idx].variables) {
      templates[idx].variables = [];
      setMechanicsTemplates(templates);
    }
    renderVariablesTable();
  };
  const originalCloseMechanicsTemplateEditor = closeMechanicsTemplateEditor;
  closeMechanicsTemplateEditor = function() {
    originalCloseMechanicsTemplateEditor();
    if (variablesTbody) variablesTbody.innerHTML = '';
  };

  // Stories page logic (for stories.html) - Bu kısmı kaldır çünkü artık index.html içinde
  // const storiesList = document.getElementById('stories-list');
  // const createNewStoryBtn = document.getElementById('create-new-story-btn');
  // const importStoryBtn = document.getElementById('import-story-btn');
  // const backToMenuBtn = document.getElementById('back-to-menu-btn');
  // if (storiesList && createNewStoryBtn && backToMenuBtn) { ... }

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
  const playerInventoryPanel = document.getElementById('player-inventory-panel');
  if (storyPlayerContainer && playerBackToMenuBtn) {
    const params = new URLSearchParams(window.location.search);
    const playTitle = params.get('title');
    let blocks = [];
    let currentIdx = 0;
    // Player state for conditions
    let playerState = {};
    let playerInventoryMode = 'disabled';
    let playerInventoryItems = [];
    let playerInventoryAssignments = {};

    function ensurePlayerInventoryAssignments() {
      if (!playerInventoryAssignments || typeof playerInventoryAssignments !== 'object') {
        playerInventoryAssignments = {};
      }
      if (!Array.isArray(playerInventoryAssignments.player)) {
        playerInventoryAssignments.player = [];
      } else {
        playerInventoryAssignments.player = playerInventoryAssignments.player.filter(id => typeof id === 'number');
      }
      if (playerInventoryMode === 'all') {
        const validKeys = new Set();
        (Array.isArray(characters) ? characters : []).forEach((_, idx) => {
          const key = `character:${idx}`;
          validKeys.add(key);
          if (!Array.isArray(playerInventoryAssignments[key])) {
            playerInventoryAssignments[key] = [];
          } else {
            playerInventoryAssignments[key] = playerInventoryAssignments[key].filter(id => typeof id === 'number');
          }
        });
        Object.keys(playerInventoryAssignments).forEach(key => {
          if (key !== 'player' && !validKeys.has(key)) {
            delete playerInventoryAssignments[key];
          }
        });
      } else {
        Object.keys(playerInventoryAssignments).forEach(key => {
          if (key !== 'player') {
            delete playerInventoryAssignments[key];
          }
        });
      }
    }

    function buildPlayerInventorySection(title, itemIds, itemsMap) {
      const safeTitle = escapeHtml(title);
      const ids = Array.isArray(itemIds) ? itemIds.filter(id => typeof id === 'number') : [];
      if (!ids.length) {
        return `<div class="player-inventory-section"><h3>${safeTitle}</h3><div class="player-inventory-empty">No items assigned.</div></div>`;
      }
      const listItems = ids.map(id => {
        const item = itemsMap.get(id);
        const name = item ? (item.name || `Item ${id}`) : `Unknown item ${id}`;
        return `<li>${escapeHtml(name)}</li>`;
      }).join('');
      return `<div class="player-inventory-section"><h3>${safeTitle}</h3><ul class="player-inventory-list">${listItems}</ul></div>`;
    }

    function renderPlayerInventory() {
      if (!playerInventoryPanel) return;
      if (playerInventoryMode === 'disabled') {
        playerInventoryPanel.innerHTML = '<div class="player-inventory-placeholder">Inventory disabled for this story.</div>';
        return;
      }
      const itemsArray = Array.isArray(playerInventoryItems) ? playerInventoryItems : [];
      if (!itemsArray.length) {
        playerInventoryPanel.innerHTML = '<div class="player-inventory-placeholder">No items defined for this story yet.</div>';
        return;
      }
      ensurePlayerInventoryAssignments();
      const itemsMap = new Map(itemsArray.map(item => [item.id, item]));
      const sections = [];
      sections.push(buildPlayerInventorySection('Player', playerInventoryAssignments.player, itemsMap));
      if (playerInventoryMode === 'all') {
        (Array.isArray(characters) ? characters : []).forEach((char, idx) => {
          const key = `character:${idx}`;
          const charName = char && char.name ? char.name : `Character ${idx + 1}`;
          sections.push(buildPlayerInventorySection(charName, playerInventoryAssignments[key], itemsMap));
        });
      }
      playerInventoryPanel.innerHTML = sections.join('');
    }

    function checkConditions(conds, contextOverrides) {
      if (!conds) return true;
      const context = {
        global: playerState,
        characters,
        ...(contextOverrides || {})
      };
      if (Array.isArray(conds)) {
        return conds.every(rule => evaluateConditionRule(rule, context));
      }
      if (conds && Array.isArray(conds.rules)) {
        const logic = conds.logic === 'any' ? 'any' : 'all';
        const evaluations = conds.rules.map(rule => evaluateConditionRule(rule, context));
        return logic === 'any' ? evaluations.some(Boolean) : evaluations.every(Boolean);
      }
      if (typeof conds === 'object') {
        for (const key in conds) {
          if (conds[key] !== playerState[key]) return false;
        }
        return true;
      }
      return true;
    }
    function renderPlayer() {
      renderPlayerInventory();
      storyPlayerContainer.innerHTML = '';
      if (!blocks.length) {
        storyPlayerContainer.innerHTML = '<div style="color:#c00;">No story loaded.</div>';
        return;
      }
      const block = blocks[currentIdx];
      // If this scene has conditions and they are not met, show locked message
      if (block.conditions && !checkConditions(block.conditions, { scene: block })) {
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
            available = checkConditions(blocks[sel.target].conditions, { scene: blocks[sel.target] });
          }
          if (available) {
          const btn = document.createElement('button');
          btn.textContent = sel.text || 'Choice ' + (selIdx + 1);
          btn.style.marginRight = '0.5em';
          btn.style.marginBottom = '0.5em';
          btn.addEventListener('click', () => {
            // Apply choice effects before navigating
            if (sel.effects && Array.isArray(sel.effects)) {
              sel.effects.forEach(effect => {
                if (effect.type === 'inventory') {
                  // Handle inventory item effects
                  const holderKey = effect.scope === 'player' ? 'player' : 
                                   (effect.scope === 'character' && typeof effect.characterId === 'number' ? 
                                    `character:${effect.characterId}` : null);
                  if (holderKey && effect.itemId !== null && effect.itemId !== undefined) {
                    const quantity = typeof effect.quantity === 'number' ? effect.quantity : 1;
                    if (effect.operation === 'give') {
                      // Give item
                      if (!playerInventoryAssignments[holderKey]) {
                        playerInventoryAssignments[holderKey] = [];
                      }
                      for (let i = 0; i < quantity; i++) {
                        playerInventoryAssignments[holderKey].push(effect.itemId);
                      }
                    } else if (effect.operation === 'remove') {
                      // Remove item
                      if (playerInventoryAssignments[holderKey]) {
                        let removed = 0;
                        playerInventoryAssignments[holderKey] = playerInventoryAssignments[holderKey].filter(id => {
                          if (removed < quantity && id === effect.itemId) {
                            removed++;
                            return false;
                          }
                          return true;
                        });
                      }
                    }
                    // Refresh inventory display after changes
                    renderPlayerInventory();
                  }
                } else if (effect.type === 'variable' || !effect.type) {
                  // Handle variable effects (existing logic)
                  // This would need to be implemented based on your variable system
                }
              });
            }
            if (sel.target != null && blocks[sel.target]) {
              currentIdx = sel.target;
              renderPlayer();
            } else {
              alert('End of story or invalid target.');
  showNotification('End of story or invalid target.', 'error');
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
            const storyData = JSON.parse(storyJson);
            blocks = storyData.scenes;
            characters = storyData.characters; // Assuming characters are also loaded
            playerInventoryMode = storyData.inventoryMode || 'disabled';
            playerInventoryItems = Array.isArray(storyData.inventoryItems) ? storyData.inventoryItems : [];
            playerInventoryAssignments = storyData.inventoryAssignments && typeof storyData.inventoryAssignments === 'object' ? storyData.inventoryAssignments : {};
            ensurePlayerInventoryAssignments();
            playerState = {};
            playerState.inventory = {
              mode: playerInventoryMode,
              items: playerInventoryItems,
              assignments: playerInventoryAssignments
            };
            currentIdx = 0;
            renderPlayer();
          } catch (e) {
            storyPlayerContainer.innerHTML = '<div style="color:#c00;">Failed to parse story: ' + e + '</div>';
            if (playerInventoryPanel) {
              playerInventoryPanel.innerHTML = '<div class="player-inventory-placeholder">Failed to load inventory.</div>';
            }
          }
        })
        .catch(e => {
          storyPlayerContainer.innerHTML = '<div style="color:#c00;">Failed to load story: ' + e + '</div>';
          if (playerInventoryPanel) {
            playerInventoryPanel.innerHTML = '<div class="player-inventory-placeholder">Failed to load inventory.</div>';
          }
        });
    } else {
      storyPlayerContainer.innerHTML = '<div style="color:#888;">No story selected.</div>';
      if (playerInventoryPanel) {
        playerInventoryPanel.innerHTML = '<div class="player-inventory-placeholder">No story loaded.</div>';
      }
    }
    playerBackToMenuBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
    return;
  }

  // --- Tab Switching Logic --- (Sadece create-story.html sayfasında çalışmalı)
  const tabScenes = document.getElementById('tab-scenes');
  const tabCharacters = document.getElementById('tab-characters');
  const tabGlobalVariables = document.getElementById('tab-global-variables');
  const tabInventory = document.getElementById('tab-inventory');
  const scenesExplorer = document.getElementById('scenes-explorer');
  const charactersExplorer = document.getElementById('characters-explorer');
  const globalVariablesExplorer = document.getElementById('global-variables-explorer');
  const inventoryExplorer = document.getElementById('inventory-explorer');

  if (
    tabScenes &&
    tabCharacters &&
    tabGlobalVariables &&
    tabInventory &&
    scenesExplorer &&
    charactersExplorer &&
    globalVariablesExplorer &&
    inventoryExplorer
  ) {
    // Helper to set active tab
    function setActiveTab(tab) {
      const addSceneBtn = document.getElementById('add-scene-btn');
      const addCharacterBtn = document.getElementById('add-character-btn');
      const addGlobalVariableBtn = document.getElementById('add-global-variable-btn');
      const previewColumn = document.getElementById('preview-column');
      const charactersConfigSection = document.getElementById('characters-config-section');
      const editorColumnEl = document.getElementById('editor-column');
      const mainDivider = document.getElementById('editor-divider');
      const deleteCharacterBtnEl = document.getElementById('delete-character-btn');
      if (deleteCharacterBtnEl) deleteCharacterBtnEl.style.display = 'none';
      
      // Reset all tabs
      [tabScenes, tabCharacters, tabGlobalVariables, tabInventory].forEach(t => {
        if (t) {
          t.classList.remove('active');
          t.style.borderBottom = 'none';
        }
      });
      [scenesExplorer, charactersExplorer, globalVariablesExplorer, inventoryExplorer].forEach(e => {
        if (e) e.style.display = 'none';
      });
      [addSceneBtn, addCharacterBtn, addGlobalVariableBtn].forEach(b => {
        if (b) b.style.display = 'none';
      });
      
      // Hide config section and show preview by default
      if (charactersConfigSection) charactersConfigSection.style.display = 'none';
      if (previewColumn) previewColumn.style.display = 'flex';
      if (editorColumnEl) editorColumnEl.style.display = 'flex';
      if (mainDivider) mainDivider.style.display = 'block';
      if (inventoryWorkspace) inventoryWorkspace.style.display = 'none';
      
      if (tab === 'scenes') {
        tabScenes.classList.add('active');
        tabScenes.style.borderBottom = '2px solid var(--color-primary)';
        scenesExplorer.style.display = '';
        if (addSceneBtn) addSceneBtn.style.display = '';
      } else if (tab === 'characters') {
        tabCharacters.classList.add('active');
        tabCharacters.style.borderBottom = '2px solid var(--color-primary)';
        charactersExplorer.style.display = '';
        if (addCharacterBtn) addCharacterBtn.style.display = '';
        // Show config section in middle, hide preview
        if (charactersConfigSection) charactersConfigSection.style.display = 'block';
        if (previewColumn) previewColumn.style.display = 'none';
        // Render trait mechanics and template when tab is switched
        if (typeof window.renderTraitMechanics === 'function') {
          window.renderTraitMechanics();
        }
        if (typeof window.renderCharacterVariablesTemplate === 'function') {
          window.renderCharacterVariablesTemplate();
        }
      } else if (tab === 'global-variables') {
        if (tabGlobalVariables) {
          tabGlobalVariables.classList.add('active');
          tabGlobalVariables.style.borderBottom = '2px solid var(--color-primary)';
        }
        if (globalVariablesExplorer) globalVariablesExplorer.style.display = '';
        if (addGlobalVariableBtn) addGlobalVariableBtn.style.display = '';
        if (typeof renderGlobalVariables === 'function') {
          renderGlobalVariables();
        }
      } else if (tab === 'inventory') {
        tabInventory.classList.add('active');
        tabInventory.style.borderBottom = '2px solid var(--color-primary)';
        inventoryExplorer.style.display = '';
        if (previewColumn) previewColumn.style.display = 'none';
        if (editorColumnEl) editorColumnEl.style.display = 'none';
        if (mainDivider) mainDivider.style.display = 'none';
        if (charactersConfigSection) charactersConfigSection.style.display = 'none';
        if (inventoryWorkspace) inventoryWorkspace.style.display = 'flex';
        renderInventorySidebar();
        renderInventoryItemsList();
        renderInventoryPreview();
      }
    }

    // Initial state
    setActiveTab('scenes');

    // Event listeners
    tabScenes.addEventListener('click', () => setActiveTab('scenes'));
    tabCharacters.addEventListener('click', () => setActiveTab('characters'));
    tabGlobalVariables.addEventListener('click', () => setActiveTab('global-variables'));
    tabInventory.addEventListener('click', () => setActiveTab('inventory'));
  }

  if (typeof renderCharacterVariablesTemplate === 'function') {
    window.renderCharacterVariablesTemplate = renderCharacterVariablesTemplate;
  }

});

