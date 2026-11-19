import 'dotenv/config';

process.env.ENV ??= 'local';
process.env.JWT_SECRET ??= 'test-secret';
// Los tests invocan los jobs directamente; nunca deben quedar timers del runner abiertos.
process.env.JOBS_ENABLED ??= 'false';
