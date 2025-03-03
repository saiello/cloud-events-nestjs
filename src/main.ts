import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CeTransportStrategy } from './cloud-events/ce-transport-strategy';
import { CeRequestDeserializer } from './cloud-events/ce-kafka-all-in-one-deserialized';
import { ValidationPipe } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);
  const microservice = await NestFactory.createMicroservice(AppModule, {
    logger: ['error', 'warn', 'debug', 'verbose'],
    // provide a custom transport strategy to consume cloud events from a configured kafka topic
    strategy: new CeTransportStrategy({
      topics: ['cloud-events'],
      client: {
        brokers: ['localhost:9094'],
        clientId: 'consumer-id',
      },
      consumer: {
        groupId: 'group-id',
      },
      subscribe: {
        fromBeginning: false,
      },
      // provide a custom deserializer to deserialize cloud events from kafka messages
      deserializer: new CeRequestDeserializer(),
    }),
  });

  microservice.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) => new RpcException(errors),
    }),
  );
  await microservice.listen();
}
bootstrap();
