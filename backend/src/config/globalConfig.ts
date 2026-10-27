const loadConfig = () => {
    const ENV = process.env.ENV;
    const JWT_SECRET = process.env.JWT_SECRET;

    const AI_SERVICE_URL = ENV === 'local' ? 'http://localhost:8000/internal/v1' : process.env.AI_SERVICE_URL;
    const AI_PROVIDER = process.env.AI_PROVIDER ?? 'ollama';

    const FRONTEND_URL = ENV === 'local' ? 'http://localhost:5173' : process.env.FRONTEND_URL;

    const AWS_REGION = process.env.AWS_REGION;
    const AWS_BUCKET = process.env.AWS_BUCKET;
    const AWS_BUCKET_KEY_PREFIX = process.env.AWS_BUCKET_KEY_PREFIX;

    const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE;

    if (
        !JWT_SECRET ||
        !FRONTEND_URL ||
        !AI_SERVICE_URL ||
        !process.env.AI_SERVICE_API_KEY ||
        !AWS_REGION ||
        !AWS_BUCKET ||
        !AWS_BUCKET_KEY_PREFIX
    ) {
        throw new Error('Missing required environment variables');
    }

    return {
        ENV,
        JWT_SECRET,
        FRONTEND_URL,
        AI_SERVICE_URL,
        AI_PROVIDER,
        AWS_REGION,
        AWS_BUCKET,
        AWS_BUCKET_KEY_PREFIX,
        BUSINESS_TIMEZONE,
    };
};

export default loadConfig();
