import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({
  imports: [
    // Imports standard NestJS event emitter capabilities globally
    EventEmitterModule.forRoot({
      // Set to true to use wildcards (e.g. 'user.*')
      wildcard: true,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
  ],
  exports: [EventEmitterModule],
})
export class EventBusModule {}
