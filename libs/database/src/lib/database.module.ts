import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({})
export class DatabaseModule {
  static forRoot(options?: Partial<TypeOrmModuleOptions>): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: (): Record<string, unknown> => ({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_DATABASE || 'erp_financial',
            autoLoadEntities: true,
            synchronize: process.env.NODE_ENV !== 'production',
            logging: process.env.NODE_ENV !== 'production',
            ...options,
          }),
        }),
      ],
    };
  }
}
