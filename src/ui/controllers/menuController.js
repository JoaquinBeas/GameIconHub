// controllers/menuController.js

export function setupMenu() {
    const menuButton = document.getElementById('menuButton');
    const menuDropdown = document.getElementById('menuDropdown');
    const menuSection = document.querySelector('.menu-section');
    const aiButton = document.getElementById('aiButton');

    let menuHoverTimeout;

    aiButton.addEventListener('click', () => {
        alert('Here would open Spacious AI!');
    });

    menuButton.addEventListener('click', () => {
        menuDropdown.classList.toggle('show');
        menuDropdown.classList.remove('hover');
        menuSection.classList.toggle('dropdown-active', menuDropdown.classList.contains('show'));
    });

    document.addEventListener('click', (e) => {
        if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.classList.remove('show', 'hover');
            menuSection.classList.remove('dropdown-active');
        }
    });

    menuButton.addEventListener('mouseenter', () => {
        clearTimeout(menuHoverTimeout);
        menuDropdown.classList.add('hover');
        menuSection.classList.add('dropdown-active');
    });

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

    document.querySelector('.menu-item[onclick="showContribute()"]')?.addEventListener('click', () => {
        alert('Contribute section - This would open a contribution page or modal');
        menuDropdown.classList.remove('show');
        menuSection.classList.remove('dropdown-active');
    });

    document.querySelector('.menu-item[onclick="showContact()"]')?.addEventListener('click', () => {
        alert('Contact section - This would open contact information or modal');
        menuDropdown.classList.remove('show');
        menuSection.classList.remove('dropdown-active');
    });
}
