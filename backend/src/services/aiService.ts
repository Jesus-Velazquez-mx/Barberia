const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

// type AiApiResponse<T> = {
//     data: T | null;
//     message: string;
//     errors: string[] | null;
// };

type AiApiHealthResponse = {
    status: string;
}

const testConnection = async (): Promise<AiApiHealthResponse> => {
    let res: Response;

    try {
        res = await fetch(`${AI_SERVICE_URL}/health`, {
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
