#!/bin/sh
set -e

echo "Running database migrations..."
node -e "
const { DataSource } = require('typeorm');
const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
});
ds.initialize()
  .then(() => ds.runMigrations({ transaction: 'all' }))
  .then((ran) => {
    console.log('Migrations applied:', ran.length);
    return ds.destroy();
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
"

echo "Starting application..."
exec node dist/main.js
