// controllers/profileController.js

import { items } from './itemController.js';

let isEditingName = false;

export function setupProfileEditing() {
    const profileName = document.getElementById('profileName');
    const editButton = document.getElementById('editButton');
    const nameInput = document.getElementById('nameInput');

    editButton.addEventListener('click', startEditingName);

    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') finishEditingName();
        else if (e.key === 'Escape') cancelEditingName();
    });

    nameInput.addEventListener('blur', finishEditingName);

    function startEditingName() {
        if (isEditingName) return;
        isEditingName = true;

        nameInput.value = profileName.textContent;
        nameInput.style.display = 'block';
        profileName.style.display = 'none';
        editButton.style.display = 'none';

        nameInput.focus();
        nameInput.select();
    }

    function finishEditingName() {
        if (!isEditingName) return;

        const newName = nameInput.value.trim();
        if (newName) profileName.textContent = newName;
        cancelEditingName();

        // Guarda cambios al JSON local
        if (window.api && typeof window.api.saveData === 'function') {
            window.api.saveData({
                username: profileName.textContent,
                ownedItems: items.filter(i => i.owned)
            });
        }
    }

    function cancelEditingName() {
        isEditingName = false;
        nameInput.style.display = 'none';
        profileName.style.display = 'block';
        editButton.style.display = 'block';
    }
}
