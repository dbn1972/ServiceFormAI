import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'error', 'warn'],
  });

  app.enableShutdownHooks();

  const logger = new Logger('QueueWorkerBootstrap');
  logger.log('ServiceFormAI queue worker is running.');
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Queue worker failed to start', error);
  process.exit(1);
});
