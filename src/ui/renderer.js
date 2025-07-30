// renderer.js

import { renderItems, handleSearch, loadInitialItems } from './controllers/itemController.js';
import { setupMenu } from './controllers/menuController.js';
import { setupModalImageClick } from './components/Modal.js';
import { renderOwnedItems, loadOwnedItemsFromPersistence } from './components/OwnedItemList.js';
import { getBackendUrl } from './utils/backendConfig.js';
import { loadLanguage } from './utils/lang.js';
import { t } from './utils/lang.js';

function wireWindowButtons() {
    const actions = [
        { id: 'minBtn', action: 'minimize' },
        { id: 'maxBtn', action: 'toggle-max', async: true },
        { id: 'closeBtn', action: 'close' }
    ];

    actions.forEach(({ id, action, async }) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('click', async () => {
            const result = await window.electronAPI.winAction(action);
        });
    });
}

function setupSearchHandlers() {
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

async function waitForBackend(retries = 20, delay = 500) {
    for (let i = 0; i < retries; i++) {
        try {
            const baseUrl = await getBackendUrl();
            const res = await fetch(`${baseUrl}/ping`);
            const data = await res.json();
            if (data.status === 'ok') {
                return true;
            }
        } catch (e) {
            console.warn(`Waiting backend (${i + 1}/${retries})...`);
        }
        await new Promise(r => setTimeout(r, delay));
    }
    throw new Error('Backend no respondió');
}

async function init() {
    // 1️⃣ Load persisted data + language
    const currentData = await window.api.loadData();
    const userLang = currentData.language || 'es_ES';
    await loadLanguage(userLang);
    const toggle = document.getElementById('language-toggle');
    if (toggle) {
        toggle.checked = (userLang === 'en_EN');
    }
    updateTextContent();
    syncronize_lang();
    wireWindowButtons();
    setupMenu();
    setupModalImageClick();
    setupSearchHandlers();

    try {
        await waitForBackend();
    } catch (e) {
        alert(t('alerts.CantConnectToBackend'));
        return;
    }

    hideLoadingOverlay();
    await loadInitialItems();
    await loadOwnedItemsFromPersistence();
    renderItems();
    await renderOwnedItems(true);
}

function syncronize_lang() {
    const toggle = document.getElementById('language-toggle');
    if (toggle) {
        toggle.addEventListener('change', async (e) => {
            const lang = e.target.checked ? 'en_EN' : 'es_ES';

            await loadLanguage(lang);
            updateTextContent();
            renderItems();
            await renderOwnedItems(true);

            const currentData = await window.api.loadData();
            currentData.language = lang;
            await window.api.saveData(currentData);
        });
    }
}

function updateTextContent() {
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.setAttribute('placeholder', t(key));
    });

    document.querySelectorAll('[data-i18n-value]').forEach(el => {
        const key = el.getAttribute('data-i18n-value');
        el.setAttribute('value', t(key));
    });
}

document.addEventListener('DOMContentLoaded', init);
