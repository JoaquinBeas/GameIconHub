let backendConfig = null;

async function waitForFileExists(filePath, retries = 50, delay = 200) {
    for (let i = 0; i < retries; i++) {
        try {
            const data = await window.fs.readFile(filePath, { encoding: 'utf8' });
            return data;
        } catch (error) {
            const isEnoent =
                error.code === 'ENOENT' ||
                (error.message && error.message.includes('ENOENT'));

            if (isEnoent) {
                await new Promise(res => setTimeout(res, delay));
                continue;
            }
            throw error;
        }
    }
    return null;
}


export async function getBackendConfig() {
    if (backendConfig) return backendConfig;

    try {
        const configPath = await window.paths.getBackendConfigPath();

        const configData = await waitForFileExists(configPath);
        if (!configData) {
            throw new Error('backend-config.json no encontrado en 10 segundos');
        }

        backendConfig = JSON.parse(configData);

        // Borrar después de leerlo para evitar puertos antiguos en siguiente arranque
        try {
            await window.fs.unlink(configPath);
        } catch (err) {
            console.warn('No se pudo borrar config.json:', err);
        }

        return backendConfig;
    } catch (error) {
        console.warn('No se pudo leer config.json, usando fallback:', error);
        backendConfig = {
            backend_port: 8000,
            backend_url: 'http://127.0.0.1:8000'
        };
        return backendConfig;
    }
}

export async function getBackendUrl() {
    const cfg = await getBackendConfig();
    return cfg.backend_url;
}

export function clearBackendConfigCache() {
    backendConfig = null;
}
