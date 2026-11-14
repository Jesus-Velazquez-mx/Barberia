const resolveAIService = (env?: string) => {
    let AI_SERVICE_URL;
    let AI_PROVIDER = process.env.AI_PROVIDER ?? 'ollama';

    // Local environment: URL points to localhost and AI_PROVIDER is through env variables
    if (env === 'local') {
        AI_SERVICE_URL = 'http://localhost:8000/internal/v1';
    } 
    // Non-local environment
    // When ONLY_EXTERNAL_AI_PROVIDER is set to "true":
    // - URL points to EXTERNAL_ONLY_AI_SERVICE_URL
    // - AI_PROVIDER is overwritten with "anthropic"
    else if (process.env.ONLY_EXTERNAL_AI_PROVIDER?.toLowerCase() === "true") {
        AI_SERVICE_URL = process.env.EXTERNAL_ONLY_AI_SERVICE_URL;
        AI_PROVIDER = 'anthropic';
    } 
    // When ONLY_EXTERNAL_AI_PROVIDER is not set or is "false":
    // - Both URL and PROVIDER as defined through env variables
    else {
        AI_SERVICE_URL = process.env.AI_SERVICE_URL;
    }

    return { AI_SERVICE_URL, AI_PROVIDER };
}

const loadConfig = () => {
    const ENV = process.env.ENV;
    const JWT_SECRET = process.env.JWT_SECRET;

    const { AI_SERVICE_URL, AI_PROVIDER } = resolveAIService(ENV);

    const FRONTEND_URL = ENV === 'local' ? 'http://localhost:5173' : process.env.FRONTEND_URL;

    const AWS_REGION = process.env.AWS_REGION;
    const AWS_BUCKET = process.env.AWS_BUCKET;
    const AWS_BUCKET_KEY_PREFIX = process.env.AWS_BUCKET_KEY_PREFIX;

    const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE;

    const required: Record<string, string | undefined> = {
        JWT_SECRET,
        FRONTEND_URL,
        AI_SERVICE_URL,
        AI_SERVICE_API_KEY: process.env.AI_SERVICE_API_KEY,
        AWS_REGION,
        AWS_BUCKET,
        AWS_BUCKET_KEY_PREFIX,
    };

    const missing = Object.keys(required).filter((key) => !required[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    console.log(AI_SERVICE_URL + " -- " + AI_PROVIDER)

    return {
        ENV,
        // Validated above: all of these are guaranteed to be non-empty
        JWT_SECRET: JWT_SECRET!,
        FRONTEND_URL: FRONTEND_URL!,
        AI_SERVICE_URL: AI_SERVICE_URL!,
        AI_PROVIDER,
        AWS_REGION: AWS_REGION!,
        AWS_BUCKET: AWS_BUCKET!,
        AWS_BUCKET_KEY_PREFIX: AWS_BUCKET_KEY_PREFIX!,
        BUSINESS_TIMEZONE,
    };
};

export default loadConfig();
