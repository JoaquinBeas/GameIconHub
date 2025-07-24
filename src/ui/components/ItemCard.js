// components/ItemCard.js

import { sendToDesktop, downloadItem } from '../controllers/itemController.js';

export function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';
    // En ItemCard.js (dentro de createItemCard)
    const favId = `favorite-${item.id}`; // Asegura ID único por card

    card.innerHTML = `
        <div class="item-picture">${item.picture}</div>
        <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="item-description">${item.description}</div>
        </div>
        <div class="item-actions">
            <input type="checkbox" id="${favId}" class="fav-btn-checkbox">
            <label for="${favId}" class="fav-btn-label" style="margin-right:10px; cursor:pointer;">
                <span class="fav-btn-icon" style="display:inline-block;">
                    <svg class="fav-btn-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -2 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 2C2.44772 2 2 2.44772 2 3V14C2 14.5523 2.44772 15 3 15H21C21.5523 15 22 14.5523 22 14V3C22 2.44772 21.5523 2 21 2H3zM3 0H21C22.6569 0 24 1.34315 24 3V14C24 15.6569 22.6569 17 21 17H3C1.34315 17 0 15.6569 0 14V3C0 1.34315 1.34315 0 3 0zM16 18C16.5523 18 17 18.4477 17 19C17 19.5523 16.5523 20 16 20H8C7.44772 20 7 19.5523 7 19C7 18.4477 7.44772 18 8 18H16z" fill="#ffffffff"/></svg>
                </span>
                <div class="fav-btn-action">
                    <span class="fav-btn-option-1">Send to desktop</span>
                    <span class="fav-btn-option-2">Remove to desktop</span>
                </div>
            </label>
            <button class="Btn" data-id="${item.id}">
                <svg class="svgIcon" viewBox="0 0 384 512" height="1em" xmlns="http://www.w3.org/2000/svg">
                  <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5
                           12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8V64c0-17.7-14.3-32-32-32s-32
                           14.3-32 32v306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3
                           0s-12.5 32.8 0 45.3l160 160z"/>                
                           </svg>
                <span class="icon2"></span>
            </button>
        </div>
    `;
    const favLabel = card.querySelector('.fav-btn-label');
    const favIconSpan = favLabel.querySelector('.fav-btn-icon');
    let isFav = false;

    const svgOn = `<svg class="fav-btn-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 -2 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 2C2.44772 2 2 2.44772 2 3V14C2 14.5523 2.44772 15 3 15H21C21.5523 15 22 14.5523 22 14V3C22 2.44772 21.5523 2 21 2H3zM3 0H21C22.6569 0 24 1.34315 24 3V14C24 15.6569 22.6569 17 21 17H3C1.34315 17 0 15.6569 0 14V3C0 1.34315 1.34315 0 3 0zM16 18C16.5523 18 17 18.4477 17 19C17 19.5523 16.5523 20 16 20H8C7.44772 20 7 19.5523 7 19C7 18.4477 7.44772 18 8 18H16z" fill="#ffffffff"/></svg>`;
    const svgOff = `<svg class="fav-btn-svg" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M23.7071 1.70711C24.0976 1.31658 24.0976 0.683417 23.7071 0.292893C23.3166 -0.0976311 22.6834 -0.0976311 22.2929 0.292893L21.2933 1.29253C21.2934 1.29241 21.2931 1.29265 21.2933 1.29253L0.292893 22.2929C-0.0976311 22.6834 -0.0976311 23.3166 0.292893 23.7071C0.683417 24.0976 1.31658 24.0976 1.70711 23.7071L2.70669 22.7075C2.70655 22.7077 2.70683 22.7074 2.70669 22.7075L23.7071 1.70711Z" fill="#ffffffff"/><path d="M17.7574 2H3C1.34315 2 1.49012e-08 3.34314 1.49012e-08 5V16C1.49012e-08 17.0219 0.510917 17.9244 1.29124 18.4661L2.78134 16.976C2.33422 16.8763 2 16.4772 2 16V5C2 4.44771 2.44772 4 3 4H15.7574L17.7574 2Z" fill="#ffffffff"/><path d="M22 6.24264L23.1213 5.12132C23.4489 4.79378 23.6848 4.40934 23.8292 3.99982C23.9398 4.31265 24 4.64929 24 5V16C24 17.6569 22.6569 19 21 19H9.24264L11.2426 17H21C21.5523 17 22 16.5523 22 16V6.24264Z" fill="#ffffffff"/><path d="M7.02398 21.2187L8.24264 20H16C16.5523 20 17 20.4477 17 21C17 21.5523 16.5523 22 16 22H8C7.52282 22 7.12371 21.6658 7.02398 21.2187Z" fill="#ffffffff"/></svg>`;

    favLabel.addEventListener('click', (e) => {
        e.preventDefault();
        isFav = !isFav;
        favIconSpan.innerHTML = isFav ? svgOff : svgOn;

        if (isFav) {
            sendToDesktop(favLabel, item.id);
        } else {
            // await removeItemFromOwnedList(item.id);
        }
    });


    const downloadBtn = card.querySelector('.Btn');
    const favoriteInput = card.querySelector('.fav-btn-checkbox');
    // favoriteInput.addEventListener('change', (e) => {
    //     console.log("afjnkaw")
    //     if (e.target.checked) {
    //         debugger;
    //         sendToDesktop(favoriteInput, item.id); // O tu lógica de favorito
    //     }
    //     // Si quieres manejar des-favorito, añade lógica aquí
    // });

    downloadBtn.addEventListener('click', () => downloadItem(item.id));

    return card;
}
