import globalConfig from '../config/globalConfig.js';
import type { AiApiHealthResponse } from '../types/dto/aiApiHealthResponse.interface.js';

const testConnection = async (): Promise<AiApiHealthResponse> => {
    let res: Response;

    try {
        res = await fetch(`${globalConfig.AI_SERVICE_URL}/health`, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        console.error(error);
        throw new Error('Network error. Could not call AI microservice');
    }

    if (!res.ok) {
        const errorMsg = `Request to AI microservice failed with status code: ${res.status}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    return (await res.json()) as AiApiHealthResponse;
};

export default { testConnection };
