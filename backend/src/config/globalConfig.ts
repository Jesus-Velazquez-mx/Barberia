
export const loadConfig = () => {
    const JWT_SECRET = process.env.JWT_SECRET;
    const FRONTEND_URL = process.env.FRONTEND_URL;
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

    if (!JWT_SECRET || !FRONTEND_URL || !AI_SERVICE_URL) {
        throw new Error('Missing required in environment variables');
    }

    return {
        JWT_SECRET,
        FRONTEND_URL,
        AI_SERVICE_URL
    }
}
