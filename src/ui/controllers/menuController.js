// controllers/menuController.js

import { getBackendUrl } from '../utils/backendConfig.js';

export function setupMenu() {
    const menuButton = document.getElementById('menuButton');
    const menuDropdown = document.getElementById('menuDropdown');
    const menuSection = document.querySelector('.menu-section');
    // const aiButton = document.getElementById('aiButton');

    let menuHoverTimeout;

    // Handle AI button click (placeholder for Spacious AI integration)
    // aiButton.addEventListener('click', () => {
    //     alert('Here would open Spacious AI!');
    // });

    // Toggle dropdown visibility when the menu button is clicked
    menuButton.addEventListener('click', () => {
        menuDropdown.classList.toggle('show');
        menuDropdown.classList.remove('hover');
        menuSection.classList.toggle('dropdown-active', menuDropdown.classList.contains('show'));
    });

    // Close dropdown when clicking outside the menu
    document.addEventListener('click', (e) => {
        if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.classList.remove('show', 'hover');
            menuSection.classList.remove('dropdown-active');
        }
    });

    // Handle hover over menu button to open dropdown
    menuButton.addEventListener('mouseenter', () => {
        clearTimeout(menuHoverTimeout);
        menuDropdown.classList.add('hover');
        menuSection.classList.add('dropdown-active');
    });

    // Handle mouse leave from menu button with slight delay
    menuButton.addEventListener('mouseleave', () => {
        menuHoverTimeout = setTimeout(() => {
            if (!menuDropdown.matches(':hover')) {
                menuDropdown.classList.remove('hover');
                if (!menuDropdown.classList.contains('show')) {
                    menuSection.classList.remove('dropdown-active');
                }
            }
        }, 200);
    });

    // Keep dropdown open while hovering over it
    menuDropdown.addEventListener('mouseenter', () => {
        clearTimeout(menuHoverTimeout);
        menuDropdown.classList.add('hover');
        menuSection.classList.add('dropdown-active');
    });

    // Hide dropdown when mouse leaves the dropdown area
    menuDropdown.addEventListener('mouseleave', () => {
        menuHoverTimeout = setTimeout(() => {
            menuDropdown.classList.remove('hover');
            if (!menuDropdown.classList.contains('show')) {
                menuSection.classList.remove('dropdown-active');
            }
        }, 200);
    });

    // Handle "Contribute" menu item click (placeholder)
    document.querySelector('.menu-item[onclick="showContribute()"]')?.addEventListener('click', () => {
        alert('Contribute section - This would open a contribution page or modal');
        menuDropdown.classList.remove('show');
        menuSection.classList.remove('dropdown-active');
    });

    // Handle "Contact" menu item click → Show form modal
    document.querySelector('.menu-item[onclick="showContact()"]')?.addEventListener('click', () => {
        const modal = document.getElementById('contactModal');
        modal.style.display = 'flex';  // Show modal
        menuDropdown.classList.remove('show');
        menuSection.classList.remove('dropdown-active');
    });
    // Optional: Hide modal when clicking outside
    document.getElementById('contactModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'contactModal') {
            e.target.style.display = 'none';
        }
    });
    document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const text = document.getElementById('text').value.trim();
        const loadingOverlay = document.getElementById('loadingOverlay');

        // Validar email simple (ver más abajo para mejora)
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("Por favor introduce un email válido.");
            return;
        }

        try {
            loadingOverlay.style.display = 'flex';  // Mostrar spinner

            const backendUrl = await getBackendUrl();
            const response = await fetch(`${backendUrl}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, text })
            });

            const result = await response.json();
            if (result.success) {
                document.getElementById('contactModal').style.display = 'none';
                e.target.reset();
            } else {
                console.log("Error al enviar el email.");
            }
        } catch (err) {
            console.error("Error al conectar con el backend:", err);
        } finally {
            loadingOverlay.style.display = 'none';  // Ocultar spinner
        }
    });
}
