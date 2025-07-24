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

    // En controllers/profileController.js
    function finishEditingName() {
        if (!isEditingName) return;

        const newName = nameInput.value.trim();
        if (newName) profileName.textContent = newName;
        cancelEditingName();

        // 🆕 Mantener los ownedItems existentes al guardar username
        if (window.api && typeof window.api.saveData === 'function') {
            window.api.loadData().then(currentData => {
                window.api.saveData({
                    username: profileName.textContent,
                    ownedItems: currentData.ownedItems || [] // 🔒 Preservar items existentes
                });
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
