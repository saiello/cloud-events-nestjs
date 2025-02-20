import { IncomingRequestDeserializer } from '@nestjs/microservices/deserializers';
import { KafkaRequest } from '@nestjs/microservices/serializers';
import { IncomingEvent, IncomingRequest } from '@nestjs/microservices';
import { CeKafkaBinaryEncodingDeserializer } from './ce-kafka-binary-encoding-deserializer';
import { CeKafkaStructuredEncodingDeserializer } from './ce-kafka-structured-encoding-deserializer';

/**
 * Deserialize cloud events from kafka messages
 * It support both structured and binary encoding
 *
 * see: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/bindings/kafka-protocol-binding.md
 */
export class CeRequestDeserializer extends IncomingRequestDeserializer {
  readonly structuredEncodingDeserializer =
    new CeKafkaStructuredEncodingDeserializer();
  readonly binaryEncodingDeserializer = new CeKafkaBinaryEncodingDeserializer();

  mapToSchema(
    kafkaRequest: KafkaRequest,
    options?: Record<string, any>,
  ): IncomingRequest | IncomingEvent {
    if (this.structuredEncodingDeserializer.canDeserialize(kafkaRequest)) {
      return this.structuredEncodingDeserializer.mapToSchema(
        kafkaRequest,
        options,
      );
    } else if (this.binaryEncodingDeserializer.canDeserialize(kafkaRequest)) {
      return this.binaryEncodingDeserializer.mapToSchema(kafkaRequest, options);
    }

    console.log('unknown cloud event format');
    return {
      pattern: undefined,
      data: undefined,
    };
  }
}
