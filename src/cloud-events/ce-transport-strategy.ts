import {
  CustomTransportStrategy,
  KafkaContext,
  ServerKafka,
} from '@nestjs/microservices';
import {
  Consumer,
  EachMessagePayload,
  KafkaMessage,
} from '@nestjs/microservices/external/kafka.interface';
import { KafkaOptions } from '@nestjs/microservices/interfaces';
import { isObservable, lastValueFrom } from 'rxjs';

export type CeKafkaOptions = Required<KafkaOptions>['options'] & {
  topics: string[];
};

export class CeTransportStrategy
  extends ServerKafka
  implements CustomTransportStrategy
{
  /*
   * Override the constructor to accept our custom options.
   * Provide topics to subscribe to, because EventHandler pattern refers to the cloud event type
   */
  constructor(private readonly ceOptions: CeKafkaOptions) {
    super(ceOptions);
  }

  /*
   * Override the bindEvents method to subscribe to the topics we provided in the options.
   */
  public async bindEvents(consumer: Consumer) {
    const consumerSubscribeOptions = this.options.subscribe || {};
    await this.consumer!.subscribe({
      ...consumerSubscribeOptions,
      topics: this.ceOptions.topics,
      fromBeginning: false,
    });
    const consumerRunOptions = Object.assign(this.options.run || {}, {
      eachMessage: this.getMessageHandler(),
    });
    await consumer.run(consumerRunOptions);
  }

  public async handleMessage(payload: EachMessagePayload): Promise<any> {
    const channel = payload.topic;
    const rawMessage = this.parser!.parse<KafkaMessage>(
      Object.assign(payload.message, {
        topic: payload.topic,
        partition: payload.partition,
      }),
    );
    const packet = await this.deserializer.deserialize(rawMessage, { channel });
    const context = new KafkaContext([
      rawMessage,
      payload.partition,
      payload.topic,
      this.consumer!,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      payload.heartbeat,
      this.producer!,
    ]);

    const handler = this.getHandlerByPattern(packet.pattern);
    if (!handler) {
      return new Error(`No handler for event ${packet.pattern}`);
    }
    try {
      const resultOrStream: unknown = await handler(packet.data, context);
      if (isObservable(resultOrStream)) {
        await lastValueFrom(resultOrStream);
      }
    } catch (error) {
      console.log('error handling events', error);
    }
  }
}
