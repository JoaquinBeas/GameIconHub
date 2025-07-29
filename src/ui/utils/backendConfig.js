// utils/backendConfig.js

let backendConfig = null;

/**
 * Lee la configuración del backend desde el archivo JSON
 * @returns {Promise<{backend_port: number, backend_url: string}>}
 */
export async function getBackendConfig() {
    if (backendConfig) {
        return backendConfig;
    }

    try {
        // En Electron, puedes leer archivos usando fs
        if (window.fs && window.fs.readFile) {
            console.log('Leyendo configuración del backend desde archivo JSON...');
            const configData = await window.fs.readFile('backend-config.json', { encoding: 'utf8' });
            backendConfig = JSON.parse(configData);
            console.log("Config: ",backendConfig);
            return backendConfig;
        }

        // Fallback: intentar fetch (para desarrollo web)
        const response = await fetch('/backend-config.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        backendConfig = await response.json();
        return backendConfig;

    } catch (error) {
        console.warn('⚠️ No se pudo leer la configuración del backend, usando puerto por defecto:', error);
        // Fallback al puerto por defecto
        backendConfig = {
            backend_port: 8000,
            backend_url: 'http://127.0.0.1:8000'
        };
        return backendConfig;
    }
}

/**
 * Obtiene la URL base del backend
 * @returns {Promise<string>}
 */
export async function getBackendUrl() {
    const config = await getBackendConfig();
    return config.backend_url;
}

/**
 * Limpia la configuración en caché (útil para recargas)
 */
export function clearBackendConfigCache() {
    backendConfig = null;
}