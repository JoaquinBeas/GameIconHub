import { deleteDesktopShortcut } from "../controllers/itemController.js";
import { getBackendUrl } from "../utils/backendConfig.js";

// 🔥 OPTIMIZED VERSION: No flickering, only updates when real changes occur
let persistentOwnedItems = [];
let lastRenderedHash = ''; // Used to detect real state changes

export async function renderOwnedItems(forceUpdate = false) {
  // 📖 Load from persistence only if necessary
  await loadOwnedItemsFromPersistence();

  // 🔍 Generate hash to detect state changes
  const currentHash = generateItemsHash(persistentOwnedItems);

  // ⚡ Skip rendering if nothing has changed and update isn't forced
  if (!forceUpdate && currentHash === lastRenderedHash) return;

  const ownedItemsList = document.getElementById('ownedItemsList');

  // 🎨 Smooth rendering without clearing everything
  await renderItemsSmooth(ownedItemsList);

  // 💾 Save current hash
  lastRenderedHash = currentHash;
}

export async function removeItemFromOwnedList(itemId) {
  const item = persistentOwnedItems.find(i => i.id === itemId);
  if (item) await deleteDesktopShortcut(item.name);
  persistentOwnedItems = persistentOwnedItems.filter(i => i.id !== itemId);
  await saveOwnedItemsToPersistence();
  await renderOwnedItems();
}

export function isItemOwned(itemId) {
  return persistentOwnedItems.some(item => item.id === itemId);
}

// 🎨 Smooth rendering that avoids flickering
async function renderItemsSmooth(container) {
  const existingItems = Array.from(container.querySelectorAll('.owned-item, .no-items-message'));
  const existingIds = existingItems.map(el => el.dataset.itemId).filter(Boolean);

  // 📝 Handle empty list case
  if (persistentOwnedItems.length === 0) {
    existingItems.forEach(el => {
      if (!el.classList.contains('no-items-message')) slideOutAndRemove(el);
    });

    if (!container.querySelector('.no-items-message')) {
      const msg = createEmptyMessage();
      container.appendChild(msg);
      slideIn(msg);
    }
    return;
  }

  // 🗑️ Remove "empty" message if present
  const emptyMsg = container.querySelector('.no-items-message');
  if (emptyMsg) slideOutAndRemove(emptyMsg);

  const currentIds = persistentOwnedItems.map(item => item.id);

  // 🔄 Update existing items or append new ones
  for (const item of persistentOwnedItems) {
    const existingElement = container.querySelector(`[data-item-id="${item.id}"]`);

    if (existingElement) {
      updateExistingItem(existingElement, item); // Update if necessary
    } else {
      const newElement = createItemElement(item); // Add new item
      container.appendChild(newElement);
      slideIn(newElement);
    }
  }

  // 🗑️ Remove stale items
  existingIds.forEach(id => {
    if (id && !currentIds.includes(id)) {
      const elementToRemove = container.querySelector(`[data-item-id="${id}"]`);
      if (elementToRemove) slideOutAndRemove(elementToRemove);
    }
  });
}

// 🏗️ Creates a visual item element
function createItemElement(item) {
  const div = document.createElement('div');
  div.className = 'owned-item';
  div.dataset.itemId = item.id;
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'space-between';
  div.style.opacity = '0';
  div.style.transform = 'translateX(-10px)';
  div.style.transition = 'all 0.2s ease-in-out';

  const text = document.createElement('span');
  text.className = 'item-text';
  updateItemText(text, item);
  text.style.flex = '1';
  text.style.cursor = 'pointer';

  div.oncontextmenu = (e) => {
    e.preventDefault();
    openItemCard(item, e.clientX, e.clientY);
  };

  const btn = createDeleteButton(item);

  div.appendChild(text);
  div.appendChild(btn);
  addTextView(text, item);

  return div;
}

// 🔄 Updates text content of an item element if changed
function updateExistingItem(element, item) {
  const textElement = element.querySelector('.item-text');
  const currentImgSrc = textElement.querySelector('img')?.src || '';
  const newImgSrc = item.smallIcon || item.img || '';
  const currentName = textElement.querySelector('span')?.textContent || '';

  if (currentImgSrc !== newImgSrc || currentName !== item.name) {
    updateItemText(textElement, item);
  }
}

// 📝 Updates inner HTML of item text
function updateItemText(textElement, item) {
  const imgSrc = item.smallIcon || item.img || '';
  textElement.innerHTML = `
    <img class="owned-item-icon" src="${imgSrc}" alt="${item.name}"
         style="width:22px;height:22px;margin-right:6px;vertical-align:middle;" />
    <span>${item.name}</span>
  `;
}

// 🗑️ Creates the delete button
function createDeleteButton(item) {
  const btn = document.createElement('button');
  btn.className = 'owned-delete-btn';
  btn.title = 'Quitar de la lista';
  btn.innerHTML = `
        <svg class="lucide lucide-trash-2" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" stroke="#7e8590" fill="none" viewBox="0 0 24 24" height="22" width="22">
          <path d="M3 6h18"></path>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          <line y2="17" y1="11" x2="10" x1="10"></line>
          <line y2="17" y1="11" x2="14" x1="14"></line>
        </svg>`;

  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await deleteDesktopShortcut(item.name);
    persistentOwnedItems = persistentOwnedItems.filter(i => i.id !== item.id);
    await saveOwnedItemsToPersistence();
    renderOwnedItems();
    import('../controllers/itemController.js').then(module => module.renderItems());
  });

  return btn;
}

// 📝 Creates a "no items" placeholder
function createEmptyMessage() {
  const msg = document.createElement('div');
  msg.className = 'no-items-message';
  msg.style.color = '#888';
  msg.style.fontSize = '14px';
  msg.style.fontStyle = 'italic';
  msg.style.opacity = '0';
  msg.style.transform = 'translateY(-10px)';
  msg.style.transition = 'all 0.2s ease-in-out';
  msg.textContent = 'No owned items yet';
  return msg;
}

// 🎬 Entry animation
function slideIn(element) {
  requestAnimationFrame(() => {
    element.style.opacity = '1';
    element.style.transform = 'translateX(0) translateY(0)';
  });
}

// 🎬 Exit animation and removal
function slideOutAndRemove(element) {
  element.style.opacity = '0';
  element.style.transform = 'translateX(-10px)';
  setTimeout(() => {
    if (element.parentNode) element.parentNode.removeChild(element);
  }, 200);
}

// 🔍 Generates hash to detect changes
function generateItemsHash(items) {
  return items.map(item => `${item.id}-${item.name}-${item.smallIcon || item.img || ''}`).join('|');
}

// 📖 Loads owned items from persistence (with caching)
let lastLoadTime = 0;
let loadCache = null;
const CACHE_DURATION = 1000; // 1 second cache

export async function loadOwnedItemsFromPersistence() {
  const now = Date.now();

  if (loadCache && (now - lastLoadTime) < CACHE_DURATION) {
    persistentOwnedItems = loadCache;
    return;
  }

  try {
    const data = await window.api.loadData();
    const items = Array.isArray(data.ownedItems) ? data.ownedItems : [];

    persistentOwnedItems = items;
    loadCache = items;
    lastLoadTime = now;
  } catch (error) {
    console.error('Error loading owned items from persistence:', error);
    persistentOwnedItems = [];
    loadCache = [];
    lastLoadTime = now;
  }
}

// 💾 Saves owned items to persistence
async function saveOwnedItemsToPersistence() {
  try {
    const currentData = await window.api.loadData();
    await window.api.saveData({
      encryptedGuid: currentData.encryptedGuid || '',
      ownedItems: persistentOwnedItems
    });

    // Invalidate cache to force fresh load next time
    loadCache = null;
    lastLoadTime = 0;
  } catch (error) {
    console.error('Error saving owned items to persistence:', error);
  }
}

// 🆕 Adds a new item to the owned sidebar list
export async function addItemToOwnedList(newItem) {
  const exists = persistentOwnedItems.some(item => item.id === newItem.id);
  if (exists) return;

  persistentOwnedItems.push({
    id: newItem.id,
    name: newItem.name,
    img: newItem.img || newItem.picture?.match(/src="([^"]+)"/)?.[1] || '',
    smallIcon: newItem.smallIcon || ''
  });

  await saveOwnedItemsToPersistence();
  renderOwnedItems();
}

// 🔄 Updates properties of an existing item (e.g. adds smallIcon)
export async function updateOwnedItem(itemId, updates) {
  const itemIndex = persistentOwnedItems.findIndex(item => item.id === itemId);
  if (itemIndex === -1) return;

  persistentOwnedItems[itemIndex] = { ...persistentOwnedItems[itemIndex], ...updates };
  await saveOwnedItemsToPersistence();
  renderOwnedItems();
}

// Tooltip handling for long names
function addTextView(text, item) {
  let tooltipTimeout;
  text.addEventListener('mouseenter', function () {
    if (this.scrollWidth > this.offsetWidth) {
      tooltipTimeout = setTimeout(() => {
        const tooltip = document.createElement('div');
        tooltip.className = 'owned-tooltip-global show';
        tooltip.textContent = item.name;
        document.body.appendChild(tooltip);

        const rect = this.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;

        const pad = 6;
        if (rect.left + rect.width / 2 - tooltip.offsetWidth / 2 < 0)
          tooltip.style.left = pad + 'px';
        if (rect.left + rect.width / 2 + tooltip.offsetWidth / 2 > window.innerWidth)
          tooltip.style.left = (window.innerWidth - tooltip.offsetWidth - pad) + 'px';
      }, 300);
    }
  });

  text.addEventListener('mouseleave', function () {
    clearTimeout(tooltipTimeout);
    document.querySelectorAll('.owned-tooltip-global').forEach(el => el.remove());
  });
}

// Opens the item context card with rename/delete options
function openItemCard(item, x, y) {
  const existing = document.querySelector('.card');
  if (existing) existing.remove();

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
      <ul class="list" style="--color:#5353ff;--hover-storke:#fff; --hover-color:#fff">
        <li class="element">
          <label for="rename">
            <input type="radio" id="rename" name="filed" checked />
            <svg class="lucide lucide-pencil" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" stroke="#7e8590" fill="none" viewBox="0 0 24 24" height="25" width="25" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
              <path d="m15 5 4 4"></path>
            </svg> Rename
          </label>
        </li>
        <li class="element delete">
          <label for="delete">
            <input type="radio" id="delete" name="filed" />
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7e8590" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              <line x1="10" x2="10" y1="11" y2="17"></line>
              <line x1="14" x2="14" y1="11" y2="17"></line>
            </svg> Delete
          </label>
        </li>
      </ul>`;
  document.body.appendChild(card);

  card.style.position = 'fixed';
  card.style.top = `${y}px`;
  card.style.left = `${x}px`;
  card.style.zIndex = '99999';

  const deleteRadio = card.querySelector('#delete');
  deleteRadio?.addEventListener('change', async () => {
    await deleteDesktopShortcut(item.name); // <- Asumiendo que `item.name` es `app_name`
    persistentOwnedItems = persistentOwnedItems.filter(i => i.id !== item.id);

    // 💾 Guarda los cambios
    await saveOwnedItemsToPersistence();

    // 🔄 Re-renderiza de forma suaveremoveItemFromOwnedList
    renderOwnedItems();
    import('../controllers/itemController.js').then(module => {
      module.renderItems(); // fuerza re-render de los ItemCards
    });
    card.remove(); // Cierra el menú

  });

  const renameRadio = card.querySelector('#rename');
  renameRadio?.addEventListener('click', () => {
    // Remove existing rename form if present
    document.querySelector('.rename-form-floating')?.remove();

    // Get card position
    const cardRect = card.getBoundingClientRect();

    // Create floating form
    const form = document.createElement('div');
    form.classList.add('rename-form-floating');
    form.style.position = 'fixed';
    form.style.top = `${cardRect.bottom + 8}px`;
    form.style.left = `${cardRect.left}px`;
    form.innerHTML = `
      <input type="text" value="${item.name}" class="rename-input" />
      <div class="rename-buttons">
        <button class="rename-save-btn">Save</button>
        <button class="rename-cancel-btn">Cancel</button>
      </div>
    `;


    document.body.appendChild(form);

    const input = form.querySelector('.rename-input');
    const saveBtn = form.querySelector('.rename-save-btn');
    const cancelBtn = form.querySelector('.rename-cancel-btn');

    cancelBtn.addEventListener('click', () => {
      form.remove();
      card.remove();
    });

    saveBtn.addEventListener('click', async () => {
      const newName = input.value.trim();
      if (!newName || newName === item.name) {
        form.remove();
        card.remove();
        return;
      }

      const oldName = item.name;

      const index = persistentOwnedItems.findIndex(i => i.id === item.id);
      if (index !== -1) {
        persistentOwnedItems[index].name = newName;
      }

      await saveOwnedItemsToPersistence();
      await renderOwnedItems(true);

      try {
        const baseUrl = await getBackendUrl();
        await fetch(`${baseUrl}/app/rename_shortcut`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            old_name: oldName,
            new_name: newName
          })
        });
      } catch (err) {
        console.error("Error renaming shortcut on backend:", err);
      }

      form.remove();
      card.remove();
    });

    input.focus();
    input.select();
  });

  setTimeout(() => {
    document.addEventListener('click', (e) => {
      if (!card.contains(e.target)) card.remove();
    }, { once: true });
  }, 10);
}