const AI_SERVICE_URL = "http://tailscale-no-se-que.net";

export type aiApiResponse<T> = {
    data: T | null;
    message: string;
    errors: string[] | null;
}

const testConnection = async (): Promise<aiApiResponse<null>> => {
    let res: Response;

    try {
        res = await fetch(`${AI_SERVICE_URL}/test`, {
            headers: {
                "Content-Type": "application/json"
            }
        })
    } catch (error) {
        throw new Error('Network error. Could not call AI microservice');
    }

    if (!res.ok) {
        const errorMsg = `Request to AI microservice failed with status code: ${res.status}`;
        console.error(errorMsg)
        throw new Error(errorMsg);
    }

    return await res.json() as aiApiResponse<null>;
}

export default { testConnection };