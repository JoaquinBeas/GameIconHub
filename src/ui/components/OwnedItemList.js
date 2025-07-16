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
        div.oncontextmenu = (e) => {
            e.preventDefault();
            openItemCard(item, e.clientX, e.clientY);
        };

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
        addTextView(text, item)
    });
}

function addTextView(text, item) {
    let tooltipTimeout;
    text.addEventListener('mouseenter', function (e) {
        // Solo si está cortado visualmente
        if (this.scrollWidth > this.offsetWidth) {
            tooltipTimeout = setTimeout(() => {
                let tooltip = document.createElement('div');
                tooltip.className = 'owned-tooltip-global show';
                tooltip.textContent = item.name;

                document.body.appendChild(tooltip);

                // Posiciona el tooltip sobre el texto
                const rect = this.getBoundingClientRect();
                tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
                tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;

                // Corrige si se sale por los lados
                const pad = 6;
                if (rect.left + rect.width / 2 - tooltip.offsetWidth / 2 < 0)
                    tooltip.style.left = pad + 'px';
                if (rect.left + rect.width / 2 + tooltip.offsetWidth / 2 > window.innerWidth)
                    tooltip.style.left = (window.innerWidth - tooltip.offsetWidth - pad) + 'px';

            }, 300);
        }
    });
    text.addEventListener('mouseleave', function (e) {
        clearTimeout(tooltipTimeout);
        document.querySelectorAll('.owned-tooltip-global').forEach(el => el.remove());
    });
}
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
        <li class="element">
          <label for="share">
            <input type="radio" id="share" name="filed" />
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7e8590" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-plus">
              <path d="M2 21a8 8 0 0 1 13.292-6"></path>
              <circle cx="10" cy="8" r="5"></circle>
              <path d="M19 16v6"></path>
              <path d="M22 19h-6"></path>
            </svg> Share
          </label>
        </li>
        <div class="separator"></div>
        <li class="element">
          <label for="go to properties">
            <input type="radio" id="Properties" name="filed" />
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7e8590" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg> Properties
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

    // Posición dinámica cerca del puntero
    card.style.position = 'fixed';
    card.style.top = `${y}px`;
    card.style.left = `${x}px`;
    card.style.zIndex = '99999';

    // Cierra si haces click fuera
    setTimeout(() => {
        document.addEventListener('click', (e) => {
            if (!card.contains(e.target)) card.remove();
        }, { once: true });
    }, 10);
}