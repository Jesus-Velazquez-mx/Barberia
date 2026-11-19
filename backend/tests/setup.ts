import 'dotenv/config';

process.env.ENV ??= 'local';
process.env.JWT_SECRET ??= 'test-secret';
process.env.AWS_REGION ??= 'us-east-1';
process.env.AWS_BUCKET ??= 'test-bucket';
process.env.AWS_BUCKET_KEY_PREFIX_USER ??= 'users';
process.env.AWS_BUCKET_KEY_PREFIX_HAIRCUTS ??= 'haircuts';
process.env.BUSINESS_TIMEZONE ??= 'America/Mazatlan';

