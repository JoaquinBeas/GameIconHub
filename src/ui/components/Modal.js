// components/Modal.js

export function setupModalImageClick() {
    const container = document.getElementById('itemsContainer');
    const overlay = document.getElementById('modalOverlay');
    const modalPicture = document.getElementById('modalPicture');

    // Show the modal when an item picture is clicked
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('item-picture')) {
            modalPicture.textContent = e.target.innerText;
            overlay.style.display = 'flex';
        }
    });

    // Close the modal when clicking outside the image area
    overlay.addEventListener('click', (e) => {
        if (e.target.id === 'modalOverlay') {
            overlay.style.display = 'none';
        }
    });
}
