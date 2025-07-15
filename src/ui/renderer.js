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

let items = [...sampleItems];
let filteredItems = [...items];

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const itemsContainer = document.getElementById('itemsContainer');
const ownedItemsList = document.getElementById('ownedItemsList');

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
            <button class="${item.owned ? 'remove-button' : 'add-button'}" 
                    onclick="toggleItem(${item.id})">
                ${item.owned ? 'Remove' : 'Add'}
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

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);