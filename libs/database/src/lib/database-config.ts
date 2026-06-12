import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

// Supported database drivers. Install the corresponding npm package before use:
//   postgres   → pg
//   mssql      → mssql
//   mysql      → mysql2
//   mariadb    → mariadb
export type DbType = 'postgres' | 'mssql' | 'mysql' | 'mariadb';

export interface ReplicaNode {
  host: string;
  port: number;
  username?: string;
  password?: string;
  database?: string;
}

export interface DatabaseConfig {
  type: DbType;
  master: ReplicaNode;
  replicas?: ReplicaNode[];
  ssl?: boolean;
  poolSize?: number;
  connectTimeout?: number;
  isExternal?: boolean;
  synchronize?: boolean;
  logging?: boolean;
  autoLoadEntities?: boolean;
}

function parseReplicas(raw?: string): ReplicaNode[] | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ReplicaNode[];
  } catch {
    // Not JSON, treat as comma-separated host:port pairs
  }

  const masterPort = Number(process.env.DB_PORT) || 5432;
  return raw.split(',').map((entry) => {
    const trimmed = entry.trim();
    const [host, portStr] = trimmed.split(':');
    return {
      host: host.trim(),
      port: portStr ? Number(portStr.trim()) : masterPort,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    };
  });
}

function buildBaseOptions(config: DatabaseConfig): TypeOrmModuleOptions {
  const {
    master,
    type,
    ssl,
    poolSize,
    connectTimeout,
    synchronize,
    logging,
    autoLoadEntities,
  } = config;

  const base: TypeOrmModuleOptions = {
    type,
    host: master.host,
    port: master.port,
    username: master.username,
    password: master.password,
    database: master.database,
    autoLoadEntities: autoLoadEntities ?? true,
    synchronize: synchronize ?? false,
    logging: logging ?? false,
    extra: {
      // Connection pool tuning
      ...(poolSize && { max: poolSize }),
      ...(connectTimeout && { connectionTimeoutMillis: connectTimeout }),
      ...(type === 'postgres' && ssl
        ? { ssl: { rejectUnauthorized: false } }
        : {}),
      ...(type === 'mssql' && ssl
        ? { encrypt: true, trustServerCertificate: false }
        : {}),
    },
  };

  return base;
}

export function loadDatabaseConfig(): DatabaseConfig {
  const type = (process.env.DB_TYPE as DbType) || 'postgres';
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || (type === 'mssql' ? 1433 : 5432);
  const username = process.env.DB_USERNAME || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const database = process.env.DB_DATABASE || 'erp_financial';

  return {
    type,
    master: { host, port, username, password, database },
    replicas: parseReplicas(process.env.DB_REPLICAS),
    ssl: process.env.DB_SSL === 'true',
    poolSize: process.env.DB_POOL_SIZE
      ? Number(process.env.DB_POOL_SIZE)
      : undefined,
    connectTimeout: process.env.DB_TIMEOUT
      ? Number(process.env.DB_TIMEOUT)
      : undefined,
    isExternal: process.env.DB_EXTERNAL === 'true',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    autoLoadEntities: true,
  };
}

export function buildTypeOrmOptions(
  config: DatabaseConfig,
): TypeOrmModuleOptions {
  const base = buildBaseOptions(config);

  if (config.replicas && config.replicas.length > 0) {
    return {
      ...base,
      replication: {
        master: {
          host: config.master.host,
          port: config.master.port,
          username: config.master.username,
          password: config.master.password,
          database: config.master.database,
        },
        slaves: config.replicas.map((r) => ({
          host: r.host,
          port: r.port,
          username: r.username || config.master.username,
          password: r.password || config.master.password,
          database: r.database || config.master.database,
        })),
      },
    } as TypeOrmModuleOptions;
  }

  return base;
}
