-- Database initialization script for microservices platform
-- This script ensures proper database setup with correct permissions
-- Run this script as postgres superuser

-- Create databases for microservices
CREATE DATABASE IF NOT EXISTS user_service_db;
CREATE DATABASE IF NOT EXISTS order_service_db;
CREATE DATABASE IF NOT EXISTS notification_service_db;
CREATE DATABASE IF NOT EXISTS inventory_service_db;
CREATE DATABASE IF NOT EXISTS audit_service_db;
CREATE DATABASE IF NOT EXISTS gitlab;

-- Create users for each service
DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'microservices_user') THEN
      CREATE USER microservices_user WITH ENCRYPTED PASSWORD 'changeme';
   END IF;
END
$do$;

DO
$do$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gitlab_user') THEN
      CREATE USER gitlab_user WITH ENCRYPTED PASSWORD 'gitlab_pass';
   END IF;
END
$do$;

-- Grant privileges on databases
GRANT ALL PRIVILEGES ON DATABASE user_service_db TO microservices_user;
GRANT ALL PRIVILEGES ON DATABASE order_service_db TO microservices_user;
GRANT ALL PRIVILEGES ON DATABASE notification_service_db TO microservices_user;
GRANT ALL PRIVILEGES ON DATABASE inventory_service_db TO microservices_user;
GRANT ALL PRIVILEGES ON DATABASE audit_service_db TO microservices_user;
GRANT ALL PRIVILEGES ON DATABASE gitlab TO gitlab_user;

-- Connect to each database and grant schema privileges
\c user_service_db;
GRANT ALL PRIVILEGES ON SCHEMA public TO microservices_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO microservices_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO microservices_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO microservices_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO microservices_user;

\c order_service_db;
GRANT ALL PRIVILEGES ON SCHEMA public TO microservices_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO microservices_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO microservices_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO microservices_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO microservices_user;

\c notification_service_db;
GRANT ALL PRIVILEGES ON SCHEMA public TO microservices_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO microservices_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO microservices_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO microservices_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO microservices_user;

\c inventory_service_db;
GRANT ALL PRIVILEGES ON SCHEMA public TO microservices_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO microservices_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO microservices_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO microservices_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO microservices_user;

\c audit_service_db;
GRANT ALL PRIVILEGES ON SCHEMA public TO microservices_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO microservices_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO microservices_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO microservices_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO microservices_user;

\c gitlab;
GRANT ALL PRIVILEGES ON SCHEMA public TO gitlab_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gitlab_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gitlab_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO gitlab_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO gitlab_user;

-- Switch back to the default database
\c postgres;

-- Display completion message
SELECT 'Database initialization completed successfully' AS status;