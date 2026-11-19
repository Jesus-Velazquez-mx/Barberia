import 'dotenv/config';

process.env.ENV ??= 'local';
process.env.JWT_SECRET ??= 'test-secret';
