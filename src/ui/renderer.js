// renderer.js

import { renderItems, handleSearch, loadInitialItems } from './controllers/itemController.js';
import { setupMenu } from './controllers/menuController.js';
import { setupModalImageClick } from './components/Modal.js';
import { renderOwnedItems, loadOwnedItemsFromPersistence } from './components/OwnedItemList.js';

async function init() {
    wireWindowButtons();
    setupMenu();
    setupModalImageClick();
    setupSearchHandlers();

    try {
        await waitForBackend();
    } catch (e) {
        alert('❌ No se pudo conectar con el backend.');
        return;
    }

    hideLoadingOverlay();
    await loadInitialItems();
    await loadOwnedItemsFromPersistence();
    renderItems();
    await renderOwnedItems(true);
}


async function waitForBackend(retries = 20, delay = 500) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch('http://localhost:8000/ping');
            const data = await res.json();
            if (data.status === 'ok') return true;
        } catch (e) {
            console.log(`⏳ Esperando backend (${i + 1}/${retries})...`);
        }
        await new Promise(r => setTimeout(r, delay));
    }
    throw new Error('Backend no respondió');
}
function wireWindowButtons() {
    const actions = [
        { id: 'minBtn', action: 'minimize' },
        { id: 'maxBtn', action: 'toggle-max', async: true },
        { id: 'closeBtn', action: 'close' }
    ];

    actions.forEach(({ id, action, async }) => {
        const btn = document.getElementById(id);
        console.log('🔍 window.electronAPI:', window.electronAPI);

        if (!btn) return;
        btn.addEventListener('click', async () => {
            console.log(`⏺️ Clicked: ${action}`);
            const result = await window.electronAPI.winAction(action);
            console.log(`✅ winAction("${action}") =>`, result);
        });
    });
}

function setupSearchHandlers() {
    const events = ['click', 'input', 'keypress'];
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');

    searchButton?.addEventListener('click', handleSearch);
    searchInput?.addEventListener('input', handleSearch);
    searchInput?.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSearch();
    });
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', init);
