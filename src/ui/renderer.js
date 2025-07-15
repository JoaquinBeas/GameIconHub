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

let items = [...sampleItems];
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
}

// Setup event listeners
function setupEventListeners() {
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
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

    card.innerHTML = `
        <div class="item-picture">${item.picture}</div>

        <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="item-description">${item.description}</div>
        </div>

        <div class="item-actions">
            <!-- Botón Send to Desktop -->
            <button class="send-btn" onclick="sendToDesktop(${item.id})">
                Send&nbsp;to&nbsp;desktop
            </button>
            <!-- Botón Download -->
            <button class="Btn" title="Download"
                    onclick="downloadItem(${item.id})">
                <svg class="svgIcon" viewBox="0 0 384 512" height="1em"
                     xmlns="http://www.w3.org/2000/svg">
                     <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160
                     c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224
                     370.8V64c0-17.7-14.3-32-32-32s-32 14.3-32
                     32v306.7L54.6 265.4c-12.5-12.5-32.8-12.5-45.3
                     0s-12.5 32.8 0 45.3l160 160z"></path>
                </svg>
                <span class="icon2"></span>
            </button>


        </div>
    `;

    return card;
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

function downloadItem(id){
    const item = items.find(i => i.id === id);
    if(!item) return;

    // Aquí iría tu lógica real de descarga…

    // Cambiar visualmente el botón
    const card        = document.querySelector(`.item-card button.Btn[onclick*="${id}"]`);
    if(!card || card.classList.contains('completed')) return;

    card.classList.add('completed');
    card.querySelector('.svgIcon').outerHTML = CHECK_SVG;  // reemplaza flecha→check
    card.querySelector('.icon2').style.display = 'none';   // quitamos la “bandeja”
    card.querySelector('.tooltip').textContent = 'Downloaded';
}


// Menu functions
function toggleMenu() {
    menuDropdown.classList.toggle('show');
    menuDropdown.classList.remove('hover');
}

function showContribute() {
    alert('Contribute section - This would open a contribution page or modal');
    menuDropdown.classList.remove('show');
}

function showContact() {
    alert('Contact section - This would open contact information or modal');
    menuDropdown.classList.remove('show');
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

function wireWindowButtons() {
    document.getElementById('minBtn').addEventListener('click', () => {
        ipcRenderer.invoke('win-action', 'minimize');
    });

    document.getElementById('maxBtn').addEventListener('click', async () => {
        const isMax = await ipcRenderer.invoke('win-action', 'toggle-max');
        document.getElementById('maxBtn').textContent = isMax ? '❐' : '□';
    });

    document.getElementById('closeBtn').addEventListener('click', () => {
        ipcRenderer.invoke('win-action', 'close');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    wireWindowButtons();
});
