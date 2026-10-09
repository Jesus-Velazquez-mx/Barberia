let ENV, JWT_SECRET, FRONTEND_URL, AI_SERVICE_URL, AI_PROVIDER;

const loadConfig = () => {
    ENV = process.env.ENV;
    JWT_SECRET = process.env.JWT_SECRET;
    FRONTEND_URL = ENV === 'local' ? 'http://localhost:5173' : process.env.FRONTEND_URL;
    AI_SERVICE_URL = ENV === 'local' ? 'http://localhost:8000/internal/v1' : process.env.AI_SERVICE_URL;
    AI_PROVIDER = process.env.AI_PROVIDER ?? 'ollama';

    if (!JWT_SECRET || !FRONTEND_URL || !AI_SERVICE_URL) {
        throw new Error('Missing required environment variables');
    }

    return {
        ENV,
        JWT_SECRET,
        FRONTEND_URL,
        AI_SERVICE_URL,
        AI_PROVIDER
    };
};

export default loadConfig();
