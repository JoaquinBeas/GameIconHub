// utils/backendConfig.js

let backendConfig = null;

// Reads the backend configuration from the JSON file
export async function getBackendConfig() {
    if (backendConfig) {
        return backendConfig;
    }

    try {
        // In Electron, you can read files using fs
        if (window.fs && window.fs.readFile) {
            const configData = await window.fs.readFile('backend-config.json', { encoding: 'utf8' });
            backendConfig = JSON.parse(configData);
            return backendConfig;
        }

        // Fallback: try fetch (for web development mode)
        const response = await fetch('/backend-config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        backendConfig = await response.json();
        return backendConfig;

    } catch (error) {
        console.warn('Could not read backend configuration, falling back to default port:', error);
        // Fallback to default port
        backendConfig = {
            backend_port: 8000,
            backend_url: 'http://127.0.0.1:8000'
        };
        return backendConfig;
    }
}

// Gets the backend base URL
export async function getBackendUrl() {
    const config = await getBackendConfig();
    return config.backend_url;
}

// Clears the cached configuration (useful for reloads)
export function clearBackendConfigCache() {
    backendConfig = null;
}
