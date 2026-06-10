import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { loadDatabaseConfig, buildTypeOrmOptions } from './database-config';

@Module({})
export class DatabaseModule {
  static forRoot(options?: Partial<TypeOrmModuleOptions>): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: (): TypeOrmModuleOptions => {
            const config = loadDatabaseConfig();
            const typeOrmOptions = buildTypeOrmOptions(config);
            return { ...typeOrmOptions, ...options } as TypeOrmModuleOptions;
          },
        }),
      ],
    };
  }

  /**
   * Creates a TypeORM connection for an external database (e.g., reporting,
   * legacy integration). The caller provides a unique connection name.
   */
  static forExternal(
    name: string,
    overrides?: Partial<TypeOrmModuleOptions>,
  ): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          name,
          useFactory: (): TypeOrmModuleOptions => {
            const config = loadDatabaseConfig();
            const typeOrmOptions = buildTypeOrmOptions(config);
            return {
              ...typeOrmOptions,
              name,
              autoLoadEntities: false, // external DBs must provide entities explicitly
              synchronize: false, // never auto-sync external DBs
              ...overrides,
            } as TypeOrmModuleOptions;
          },
        }),
      ],
    };
  }
}
