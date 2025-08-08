// controllers/itemController.js
import { createItemCard } from '../components/ItemCard.js';
import { renderOwnedItems } from '../components/OwnedItemList.js';
import { addItemToOwnedList, updateOwnedItem } from '../components/OwnedItemList.js'; // Import
import { getBackendUrl } from '../utils/backendConfig.js';
import { t } from '../utils/lang.js';

export let items = [];
export let filteredItems = [];
let searchTimeout;

// Renders the filtered items into the container
export function renderItems() {
    const container = document.getElementById('itemsContainer');
    container.innerHTML = '';
    filteredItems.forEach(item => {
        const card = createItemCard(item);
        container.appendChild(card);
        requestAnimationFrame(() => {
            card.classList.add('show');
        });
    });
}

// Loads the initial items from the backend
export async function loadInitialItems() {
    try {
        const baseUrl = await getBackendUrl();

        // Try smart retry on paginated endpoint
        let res = await fetchWithRetry(`${baseUrl}/search/paginated?term=&start=0&count=20`);
        let data = await res.json();

        // Fallback to /suggest if result is too small
        if (!Array.isArray(data) || data.length < 3) {
            console.warn('Paginated search is empty, falling back to suggestions...');
            const suggestRes = await fetchWithRetry(`${baseUrl}/suggest?term=`);
            data = await suggestRes.json();
        }

        items = data
            .filter(item => item.type === "app")
            .map(item => ({
                id: item.id,
                name: item.name,
                description: '',
                picture: `<img src="${item.img}" alt="${item.name}" />`,
                owned: false,
                sent: false
            }));

        filteredItems = [...items];
    } catch (err) {
        console.error('Error loading initial items:', err);
        alert(t('alerts.CantConnectToBackend'));
    }
}

// Retry wrapper for fetch with delay and retries
async function fetchWithRetry(url, retries = 10, delay = 500) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url);
            if (res.ok) return res;
        } catch (e) {
            console.warn(`Waiting for backend... attempt ${i + 1}/${retries}`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    throw new Error(`Could not connect to backend at ${url}`);
}

// Handles the search input and results
export function handleSearchDebounced() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        handleSearch();
    }, 300); // espera 300 ms desde la última tecla
}

async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    const query = encodeURIComponent(searchTerm);

    try {
        const baseUrl = await getBackendUrl();
        let url = `${baseUrl}/search/paginated?term=${query}&start=0&count=20`;

        let res = await fetch(url);
        let data = await res.json();

        // Fallback a /suggest si es pequeño
        if (!Array.isArray(data) || data.length < 3) {
            console.warn('Search returned empty. Trying /suggest...');
            const fallbackRes = await fetch(`${baseUrl}/suggest?term=${query}`);
            data = await fallbackRes.json();
        }

        items = data
            .filter(item => item.type === "app")
            .map(item => ({
                id: item.id,
                name: item.name,
                description: '',
                picture: `<img src="${item.img}" alt="${item.name}" />`,
                owned: false,
                sent: false
            }));

        filteredItems = [...items];
        renderItems();
        renderOwnedItems(items, filteredItems, renderItems);
    } catch (err) {
        console.error('Error searching for games:', err);
    }
}

// Handles sending an item to the desktop (creates a shortcut)
export async function sendToDesktop(button, itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item || button.classList.contains('sent')) return;

    button.classList.add('sent');
    const text = button.querySelector('.text');
    if (text) text.innerHTML = `${t('translations.Sent')} ✔️`;

    const baseUrl = await getBackendUrl();

    // 🆕 Add to the independent sidebar list
    const itemForSidebar = {
        id: item.id,
        name: item.name,
        img: item.picture?.match(/src="([^"]+)"/)?.[1] || ''
    };

    // 👇 Fetch the small icon from backend
    try {
        const res = await fetch(`${baseUrl}/app/${itemId}/small_icon_url`);
        const data = await res.json();
        if (data.icon_url) {
            itemForSidebar.smallIcon = data.icon_url;
        }
    } catch (err) {
        console.warn('Could not load small icon for app:', itemId, err);
    }

    // 🏷️ Add item to sidebar
    await addItemToOwnedList(itemForSidebar);

    try {
        await fetch(`${baseUrl}/app/${item.id}/generate_shortcut`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                app_name: item.name
            })
        });
    } catch (err) {
        console.warn('Could not create shortcut on desktop:', err);
    }
}

// Handles download button click for an item
export async function downloadItem(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const card = document.querySelector(`.Btn[data-id="${itemId}"]`);
    if (!card || card.classList.contains('completed') || card.classList.contains('downloading')) return;

    // Show loading state
    showLoadingState(card);

    try {
        await downloadImage(itemId);

        // Mark as completed
        hideLoadingState(card);
        showCompletedState(card);

    } catch (error) {
        hideLoadingState(card);
        console.error(`Error downloading image for ${item.name}:`, error);
        showErrorState(card);
    }
}

// Requests backend to delete a shortcut
export async function deleteDesktopShortcut(appName) {
    try {
        const result = await window.api.deleteShortcut(appName);
        if (result.success) {
        } else {
            console.warn('Failed to delete shortcut:', result.message);
        }
    } catch (err) {
        console.error('Error deleting shortcut:', err);
    }
}

// Browser-compatible file downloader
async function downloadImage(itemId) {
    try {
        const baseUrl = await getBackendUrl();
        const url = `${baseUrl}/app/${itemId}/icon`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        // Change the extension to .ico
        const item = items.find(i => i.id === itemId);
        const filename = item ? `${item.name.replace(/[^a-z0-9]/gi, '_')}.ico` : `${itemId}.ico`;
        link.download = filename;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        return `${t('translations.ImageDownloaded')} ${filename}`;
    } catch (error) {
        throw new Error(`Error downloading image: ${error.message}`);
    }
}

// Shows a full-screen loader
function showLoadingState(card) {
    card.classList.add('downloading');

    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.id = 'downloadLoader';
    loader.innerHTML = `
        <div class="justify-content-center jimu-primary-loading"></div>
    `;

    document.body.appendChild(loader);
    document.body.style.overflow = 'hidden';
}

// Removes the loader and unlocks scroll
function hideLoadingState(card) {
    card.classList.remove('downloading');

    const loader = document.getElementById('downloadLoader');
    if (loader) {
        loader.remove();
    }

    document.body.style.overflow = '';
}

// Marks the button as completed with a checkmark
function showCompletedState(card) {
    card.classList.add('completed');

    const CHECK_SVG = `<svg class="svgIcon" viewBox="0 0 512 512" height="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M173.9 439.4L7 272c-9.4-9.4-9.4-24.6
        0-33.9l22.6-22.6c9.4-9.4 24.6-9.4
        33.9 0L192 312.3 449.4 54.6c9.4-9.4
        24.6-9.4 33.9 0l22.6 22.6c9.4 9.4
        9.4 24.6 0 33.9L226.6 439.4c-9.4
        9.4-24.6 9.4-34 .0z"/>
    </svg>`;

    const svgIcon = card.querySelector('.svgIcon');
    const icon2 = card.querySelector('.icon2');

    if (svgIcon) svgIcon.outerHTML = CHECK_SVG;
    if (icon2) icon2.style.display = 'none';
}

// Briefly marks the button as error
function showErrorState(card) {
    card.style.borderColor = '#ff4444';

    setTimeout(() => {
        card.style.borderColor = '';
    }, 3000);
}
