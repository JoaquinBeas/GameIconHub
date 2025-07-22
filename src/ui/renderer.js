// renderer.js

import { renderItems, handleSearch, loadInitialItems } from './controllers/itemController.js';
import { setupProfileEditing } from './controllers/profileController.js';
import { setupMenu } from './controllers/menuController.js';
import { setupModalImageClick } from './components/Modal.js';
import { items, filteredItems } from './controllers/itemController.js';
import { renderOwnedItems } from './components/OwnedItemList.js';

async function init() {
    await loadInitialItems(); // 🔁 nuevo paso antes de renderizar
    loadSideBar()
    renderItems();
    renderOwnedItems(items, filteredItems, renderItems);
    setupProfileEditing();
    setupMenu();
    setupModalImageClick();
    wireWindowButtons();

    window.setCurrentUsername = setCurrentUsername;
    // Search input
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSearch();
    });
}

function wireWindowButtons() {
    document.getElementById('minBtn').addEventListener('click', () => {
        window.electronAPI.winAction('minimize');
    });

    document.getElementById('maxBtn').addEventListener('click', async () => {
        await window.electronAPI.winAction('toggle-max');
    });

    document.getElementById('closeBtn').addEventListener('click', () => {
        window.electronAPI.winAction('close');
    });
}
function getCurrentUsername() {
    return document.getElementById('profileName')?.textContent || '';
}
window.getCurrentUsername = getCurrentUsername;

function setCurrentUsername(username) {
    const el = document.getElementById('profileName');
    if (el) el.textContent = username;
}
function loadSideBar() {
    window.api.loadData().then(data => {
        if (data.username) setCurrentUsername(data.username);
        if (Array.isArray(data.ownedItems)) {
            items.forEach(i => {
                i.owned = data.ownedItems.some(o => o.id === i.id);
            });
            filteredItems.length = 0;
            filteredItems.push(...items);
            renderItems();
            renderOwnedItems(items, filteredItems, renderItems);
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
