// controllers/itemController.js

import { createItemCard } from '../components/ItemCard.js';
import { renderOwnedItems } from '../components/OwnedItemList.js';

export let items = [];
export let filteredItems = [];

export function renderItems() {
    const container = document.getElementById('itemsContainer');
    container.innerHTML = '';
    filteredItems.forEach(item => {
        const card = createItemCard(item);
        container.appendChild(card);
    });
}

export async function loadInitialItems() {
    try {
        let res = await fetch('http://localhost:8000/search/paginated?term=&start=0&count=20');
        let data = await res.json();

        // Fallback a /suggest si está vacío
        if (!Array.isArray(data) || data.length < 3) {
            console.warn('Paginated search is empty, using suggest instead.');
            const suggestRes = await fetch('http://localhost:8000/suggest?term=');
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
        console.error('Error al cargar items iniciales:', err);
    }
}

export async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    const query = encodeURIComponent(searchTerm);

    let url = `http://localhost:8000/search/paginated?term=${query}&start=0&count=20`;

    try {
        let res = await fetch(url);
        let data = await res.json();

        // Fallback a /suggest si vacío
        if (!Array.isArray(data) || data.length < 3) {
            console.warn('Search returned empty. Trying /suggest...');
            const fallbackRes = await fetch(`http://localhost:8000/suggest?term=${query}`);
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
        console.error('Error al buscar juegos:', err);
    }
}


export function sendToDesktop(button, itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item || button.classList.contains('sent')) return;

    button.classList.add('sent');
    const text = button.querySelector('.text');
    if (text) text.innerHTML = 'Sent ✔️';

    if (!item.owned) {
        item.owned = true;
        const filteredItem = filteredItems.find(i => i.id === itemId);
        if (filteredItem) filteredItem.owned = true;
        renderOwnedItems(items, filteredItems, renderItems);
    }
}

export function downloadItem(itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const card = document.querySelector(`.button.Btn[data-id="${itemId}"]`) || document.querySelector(`.Btn[data-id="${itemId}"]`);
    if (!card || card.classList.contains('completed')) return;
    card.classList.add('completed');
    const CHECK_SVG = `<svg class="svgIcon" viewBox="0 0 512 512" height="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M173.9 439.4L7 272c-9.4-9.4-9.4-24.6
        0-33.9l22.6-22.6c9.4-9.4 24.6-9.4
        33.9 0L192 312.3 449.4 54.6c9.4-9.4
        24.6-9.4 33.9 0l22.6 22.6c9.4 9.4
        9.4 24.6 0 33.9L226.6 439.4c-9.4
        9.4-24.6 9.4-34 .0z"/>
    </svg>`;
    card.querySelector('.svgIcon').outerHTML = CHECK_SVG;
    card.querySelector('.icon2').style.display = 'none';
}
