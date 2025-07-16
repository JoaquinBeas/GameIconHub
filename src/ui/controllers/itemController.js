// controllers/itemController.js

import { createItemCard } from '../components/ItemCard.js';
import { renderOwnedItems } from '../components/OwnedItemList.js';
import { sampleItems } from '../data/items.js';

export let items = sampleItems.map(i => ({ ...i, owned: false, sent: false }));
export let filteredItems = [...items];

export function renderItems() {
    const container = document.getElementById('itemsContainer');
    container.innerHTML = '';
    filteredItems.forEach(item => {
        const card = createItemCard(item);
        container.appendChild(card);
    });
}

export function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();

    filteredItems = (searchTerm === '')
        ? [...items]
        : items.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );

    renderItems();
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

    const card = document.querySelector(`.item-card button.Btn[onclick*="${itemId}"]`);
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
