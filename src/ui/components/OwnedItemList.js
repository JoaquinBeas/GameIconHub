// components/OwnedItemList.js

export function renderOwnedItems(items, filteredItems, renderItemsCallback) {
    const ownedItemsList = document.getElementById('ownedItemsList');
    ownedItemsList.innerHTML = '';

    const ownedItems = items.filter(i => i.owned);

    if (ownedItems.length === 0) {
        const msg = document.createElement('div');
        msg.style.color = '#888';
        msg.style.fontSize = '14px';
        msg.style.fontStyle = 'italic';
        msg.textContent = 'No owned items yet';
        ownedItemsList.appendChild(msg);
        return;
    }

    ownedItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'owned-item';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'space-between';

        const text = document.createElement('span');
        text.textContent = `${item.picture} ${item.name}`;
        text.style.flex = '1';
        text.style.cursor = 'pointer';

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

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            item.owned = false;

            const filteredItem = filteredItems.find(i => i.id === item.id);
            if (filteredItem) filteredItem.owned = false;

            renderOwnedItems(items, filteredItems, renderItemsCallback);
            renderItemsCallback();
        });

        div.appendChild(text);
        div.appendChild(btn);
        ownedItemsList.appendChild(div);
    });
}
