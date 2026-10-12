export const testDatabaseUrl =
    process.env.TEST_DATABASE_URL ??
    'postgres://flex:flex@localhost:5433/flex_test';
