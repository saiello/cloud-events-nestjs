import { CustomTransportStrategy, ServerKafka } from '@nestjs/microservices';
import { Consumer } from '@nestjs/microservices/external/kafka.interface';
import { KafkaOptions } from '@nestjs/microservices/interfaces';

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
}
