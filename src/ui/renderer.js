// Sample data for items
const sampleItems = [
    {
        id: 1,
        name: "Wireless Headphones",
        description: "High-quality wireless headphones with noise cancellation and 30-hour battery life",
        picture: "🎧",
        owned: false
    },
    {
        id: 2,
        name: "Smart Watch",
        description: "Fitness tracking smartwatch with heart rate monitor and GPS functionality",
        picture: "⌚",
        owned: false
    },
    {
        id: 3,
        name: "Laptop Stand",
        description: "Adjustable aluminum laptop stand for ergonomic workspace setup",
        picture: "💻",
        owned: false
    },
    {
        id: 4,
        name: "Coffee Maker",
        description: "Automatic drip coffee maker with programmable timer and thermal carafe",
        picture: "☕",
        owned: false
    },
    {
        id: 5,
        name: "Desk Lamp",
        description: "LED desk lamp with adjustable brightness and color temperature",
        picture: "💡",
        owned: false
    },
    {
        id: 6,
        name: "Wireless Mouse",
        description: "Ergonomic wireless mouse with precision tracking and long battery life",
        picture: "🖱️",
        owned: false
    },
    {
        id: 7,
        name: "Bluetooth Speaker",
        description: "Portable Bluetooth speaker with 360-degree sound and waterproof design",
        picture: "🔊",
        owned: false
    },
    {
        id: 8,
        name: "Phone Case",
        description: "Protective phone case with shock absorption and wireless charging compatibility",
        picture: "📱",
        owned: false
    }
];

const CHECK_SVG = `
<svg class="svgIcon" viewBox="0 0 512 512" height="1em"
     xmlns="http://www.w3.org/2000/svg">
  <path d="M173.9 439.4L7 272c-9.4-9.4-9.4-24.6
           0-33.9l22.6-22.6c9.4-9.4 24.6-9.4
           33.9 0L192 312.3 449.4 54.6c9.4-9.4
           24.6-9.4 33.9 0l22.6 22.6c9.4 9.4
           9.4 24.6 0 33.9L226.6 439.4c-9.4
           9.4-24.6 9.4-34 .0z"/>
</svg>`;
const { ipcRenderer } = require('electron');

let items = sampleItems.map(i => ({ ...i, owned: false, sent: false })); // ← add sent flag
let filteredItems = [...items];

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const itemsContainer = document.getElementById('itemsContainer');
const ownedItemsList = document.getElementById('ownedItemsList');
const profileName = document.getElementById('profileName');
const editButton = document.getElementById('editButton');
const nameInput = document.getElementById('nameInput');
const menuButton = document.getElementById('menuButton');
const menuDropdown = document.getElementById('menuDropdown');

let isEditingName = false;
let menuHoverTimeout;

// Initialize the app
function init() {
    renderItems();
    renderOwnedItems();
    setupEventListeners();
    setupModalImageClick();
    setupMenuHoverWithAIMovement();
}

// Setup event listeners
function setupEventListeners() {
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    document.getElementById('aiButton').addEventListener('click', () => {
        alert('Here would open Spacious AI!');
    });
    // Real-time search as user types
    searchInput.addEventListener('input', handleSearch);

    // Profile name editing
    editButton.addEventListener('click', startEditingName);
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            finishEditingName();
        } else if (e.key === 'Escape') {
            cancelEditingName();
        }
    });
    nameInput.addEventListener('blur', finishEditingName);

    // Menu functionality
    menuButton.addEventListener('click', toggleMenu);

    // Menu hover functionality
    menuButton.addEventListener('mouseenter', () => {
        clearTimeout(menuHoverTimeout);
        menuDropdown.classList.add('hover');
    });

    menuButton.addEventListener('mouseleave', () => {
        menuHoverTimeout = setTimeout(() => {
            if (!menuDropdown.matches(':hover')) {
                menuDropdown.classList.remove('hover');
            }
        }, 200);
    });

    menuDropdown.addEventListener('mouseenter', () => {
        clearTimeout(menuHoverTimeout);
        menuDropdown.classList.add('hover');
    });

    menuDropdown.addEventListener('mouseleave', () => {
        menuHoverTimeout = setTimeout(() => {
            menuDropdown.classList.remove('hover');
        }, 200);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.classList.remove('show');
        }
    });
}

// Handle search functionality
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (searchTerm === '') {
        filteredItems = [...items];
    } else {
        filteredItems = items.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
    }

    renderItems();
}

// Render items in the main container
function renderItems() {
    itemsContainer.innerHTML = '';

    filteredItems.forEach(item => {
        const itemCard = createItemCard(item);
        itemsContainer.appendChild(itemCard);
    });
}

// Create item card element
function createItemCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card';

    /* ——— markup completo ——— */
    card.innerHTML = `
        <div class="item-picture">${item.picture}</div>

        <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="item-description">${item.description}</div>
        </div>

        <div class="item-actions">

            <!-- ✈️  NEW  “Send to Desktop” -->
<button class="send-btn-modern" onclick="sendToDesktop(this, ${item.id})">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24" class="icon">
        <path fill="#000000"
            d="M14.2199 21.63C13.0399 21.63 11.3699 20.8 10.0499 16.83L9.32988 14.67L7.16988 13.95C3.20988 12.63 2.37988 10.96 2.37988 9.78001C2.37988 8.61001 3.20988 6.93001 7.16988 5.60001L15.6599 2.77001C17.7799 2.06001 19.5499 2.27001 20.6399 3.35001C21.7299 4.43001 21.9399 6.21001 21.2299 8.33001L18.3999 16.82C17.0699 20.8 15.3999 21.63 14.2199 21.63ZM7.63988 7.03001C4.85988 7.96001 3.86988 9.06001 3.86988 9.78001C3.86988 10.5 4.85988 11.6 7.63988 12.52L10.1599 13.36C10.3799 13.43 10.5599 13.61 10.6299 13.83L11.4699 16.35C12.3899 19.13 13.4999 20.12 14.2199 20.12C14.9399 20.12 16.0399 19.13 16.9699 16.35L19.7999 7.86001C20.3099 6.32001 20.2199 5.06001 19.5699 4.41001C18.9199 3.76001 17.6599 3.68001 16.1299 4.19001L7.63988 7.03001Z" />
        <path fill="#000000"
            d="M10.11 14.4C9.92 14.4 9.73 14.33 9.58 14.18C9.29 13.89 9.29 13.41 9.58 13.12L13.16 9.53C13.45 9.24 13.93 9.24 14.22 9.53C14.51 9.82 14.51 10.3 14.22 10.59L10.64 14.18C10.5 14.33 10.3 14.4 10.11 14.4Z" />
    </svg>
    <p class="text">
        <span>S</span><span>e</span><span>n</span><span>d</span>
        <span class="tab"></span>
        <span>D</span><span>e</span><span>s</span><span>k</span>
    </p>
</button>

            <!-- ⬇️ Download circular -->
            <button class="Btn" onclick="downloadItem(${item.id})">
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

    return card;
}
function sendToDesktop(button, itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item || button.classList.contains('sent')) return;

    // Lock the "Sent" state
    button.classList.add('sent');
    const text = button.querySelector('.text');
    if (text) text.innerHTML = 'Sent ✔️';
}


// Toggle item between owned and not owned
function toggleItem(itemId) {
    const item = items.find(i => i.id === itemId);
    if (item) {
        item.owned = !item.owned;

        // Update filtered items as well
        const filteredItem = filteredItems.find(i => i.id === itemId);
        if (filteredItem) {
            filteredItem.owned = item.owned;
        }

        renderItems();
        renderOwnedItems();

        // Add some visual feedback
        const button = event.target;
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);
    }
}

// Render owned items in the sidebar
function renderOwnedItems() {
    const ownedItems = items.filter(item => item.owned);

    ownedItemsList.innerHTML = '';

    if (ownedItems.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.style.color = '#888';
        emptyMessage.style.fontSize = '14px';
        emptyMessage.style.fontStyle = 'italic';
        emptyMessage.textContent = 'No owned items yet';
        ownedItemsList.appendChild(emptyMessage);
        return;
    }

    ownedItems.forEach(item => {
        const ownedItem = document.createElement('div');
        ownedItem.className = 'owned-item';
        ownedItem.innerHTML = `${item.picture} ${item.name}`;

        // Add click handler to scroll to item in main list
        ownedItem.addEventListener('click', () => {
            // Clear search to show all items
            searchInput.value = '';
            handleSearch();

            // Scroll to the item
            setTimeout(() => {
                const itemCards = document.querySelectorAll('.item-card');
                const targetCard = Array.from(itemCards).find(card => {
                    const nameElement = card.querySelector('.item-name');
                    return nameElement && nameElement.textContent === item.name;
                });

                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.style.borderColor = '#007aff';
                    setTimeout(() => {
                        targetCard.style.borderColor = '#4a4a4a';
                    }, 2000);
                }
            }, 100);
        });

        ownedItemsList.appendChild(ownedItem);
    });
}

// Profile name editing functions
function startEditingName() {
    if (isEditingName) return;

    isEditingName = true;
    const currentName = profileName.textContent;

    nameInput.value = currentName;
    nameInput.style.display = 'block';
    profileName.style.display = 'none';
    editButton.style.display = 'none';

    nameInput.focus();
    nameInput.select();
}

function finishEditingName() {
    if (!isEditingName) return;

    const newName = nameInput.value.trim();
    if (newName && newName !== profileName.textContent) {
        profileName.textContent = newName;
    }

    cancelEditingName();
}

function cancelEditingName() {
    isEditingName = false;
    nameInput.style.display = 'none';
    profileName.style.display = 'block';
    editButton.style.display = 'block';
}

function downloadItem(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Aquí iría tu lógica real de descarga…

    // Cambiar visualmente el botón
    const card = document.querySelector(`.item-card button.Btn[onclick*="${id}"]`);
    if (!card || card.classList.contains('completed')) return;

    card.classList.add('completed');
    card.querySelector('.svgIcon').outerHTML = CHECK_SVG;  // reemplaza flecha→check
    card.querySelector('.icon2').style.display = 'none';   // quitamos la “bandeja”
    card.querySelector('.tooltip').textContent = 'Downloaded';
}


// Menu functions
function toggleMenu() {
    const menuSection = document.querySelector('.menu-section');
    console.log('toggleMenu called');
    console.log('menuSection found:', menuSection);
    
    menuDropdown.classList.toggle('show');
    menuDropdown.classList.remove('hover');
    
    // Check if dropdown is now shown
    if (menuDropdown.classList.contains('show')) {
        console.log('Adding dropdown-active class');
        menuSection.classList.add('dropdown-active');
    } else {
        console.log('Removing dropdown-active class');
        menuSection.classList.remove('dropdown-active');
    }
    
    // Debug: log current classes
    console.log('menuSection classes:', menuSection.className);
    console.log('menuDropdown classes:', menuDropdown.className);
}

function showContribute() {
    const menuSection = document.querySelector('.menu-section');
    alert('Contribute section - This would open a contribution page or modal');
    menuDropdown.classList.remove('show');
    menuSection.classList.remove('dropdown-active');
}

function showContact() {
    const menuSection = document.querySelector('.menu-section');
    alert('Contact section - This would open contact information or modal');
    menuDropdown.classList.remove('show');
    menuSection.classList.remove('dropdown-active');
}
document.addEventListener('click', (e) => {
    const menuSection = document.querySelector('.menu-section');
    if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
        console.log('Clicking outside - removing dropdown-active');
        menuDropdown.classList.remove('show');
        menuSection.classList.remove('dropdown-active');
    }
});
document.addEventListener('click', (e) => {
    const menuSection = document.querySelector('.menu-section');
    if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
        menuDropdown.classList.remove('show');
        menuSection.classList.remove('dropdown-active'); // Move AI button back
    }
});
// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

function wireWindowButtons() {
    document.getElementById('minBtn').addEventListener('click', () => {
        ipcRenderer.invoke('win-action', 'minimize');
    });

    document.getElementById('maxBtn').addEventListener('click', async () => {
        const isMax = await ipcRenderer.invoke('win-action', 'toggle-max');
        // document.getElementById('maxBtn').textContent = isMax ? '❐' : '□';
    });

    document.getElementById('closeBtn').addEventListener('click', () => {
        ipcRenderer.invoke('win-action', 'close');
    });
}
function setupModalImageClick() {
    document.getElementById('itemsContainer').addEventListener('click', function (e) {
        const target = e.target;
        if (target.classList.contains('item-picture')) {
            const picture = target.innerText;
            const modal = document.getElementById('modalOverlay');
            const modalPic = document.getElementById('modalPicture');
            modalPic.textContent = picture;
            modal.style.display = 'flex';
        }
    });

    // Cerrar modal al clickar fuera
    document.getElementById('modalOverlay').addEventListener('click', function (e) {
        if (e.target.id === 'modalOverlay') {
            this.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    wireWindowButtons();
});

function setupMenuHoverWithAIMovement() {
    const menuSection = document.querySelector('.menu-section');
    const menuButton = document.getElementById('menuButton');
    const menuDropdown = document.getElementById('menuDropdown');

    menuButton.addEventListener('mouseenter', () => {
        clearTimeout(menuHoverTimeout);
        menuDropdown.classList.add('hover');
        menuSection.classList.add('dropdown-active'); // Sube el AI button
    });

    menuButton.addEventListener('mouseleave', () => {
        menuHoverTimeout = setTimeout(() => {
            if (!menuDropdown.matches(':hover')) {
                menuDropdown.classList.remove('hover');
                if (!menuDropdown.classList.contains('show')) {
                    menuSection.classList.remove('dropdown-active'); // Baja el AI button solo si no está abierto por click
                }
            }
        }, 200);
    });

    menuDropdown.addEventListener('mouseenter', () => {
        clearTimeout(menuHoverTimeout);
        menuDropdown.classList.add('hover');
        menuSection.classList.add('dropdown-active');
    });

    menuDropdown.addEventListener('mouseleave', () => {
        menuHoverTimeout = setTimeout(() => {
            menuDropdown.classList.remove('hover');
            if (!menuDropdown.classList.contains('show')) {
                menuSection.classList.remove('dropdown-active');
            }
        }, 200);
    });

    // --- NUEVO: click en menú hamburguesa ---
    menuButton.addEventListener('click', () => {
        // Toggle dropdown
        menuDropdown.classList.toggle('show');
        // SI el menú está abierto (show), mantenemos el AI button elevado
        if (menuDropdown.classList.contains('show')) {
            menuSection.classList.add('dropdown-active');
        } else {
            menuSection.classList.remove('dropdown-active');
        }
    });

    // --- NUEVO: click fuera para cerrar dropdown y bajar AI button ---
    document.addEventListener('click', (e) => {
        if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.classList.remove('show');
            menuDropdown.classList.remove('hover');
            menuSection.classList.remove('dropdown-active'); // Baja el AI button si se hace click fuera
        }
    });
}
