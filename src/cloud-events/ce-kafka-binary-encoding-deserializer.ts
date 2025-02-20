import { IncomingRequestDeserializer } from '@nestjs/microservices/deserializers';
import { KafkaRequest } from '@nestjs/microservices/serializers';
import { IncomingEvent, IncomingRequest } from '@nestjs/microservices';

/**
 * Deserialize cloud events in binary encoding from kafka messages
 *
 * see: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/bindings/kafka-protocol-binding.md
 *
 *      ------------------ Message -------------------
 *      Topic Name: mytopic
 *      ------------------- key ----------------------
 *      Key: mykey
 *      ------------------ headers -------------------
 *      ce_specversion: "1.0"
 *      ce_type: "com.example.someevent"
 *      ce_source: "/mycontext/subcontext"
 *      ce_id: "1234-1234-1234"
 *      ce_time: "2018-04-05T03:56:24Z"
 *      content-type: application/avro
 *      .... further attributes ...
 *      ------------------- value --------------------
 *      ... application data encoded in Avro ...
 *      -----------------------------------------------
 *
 */
export class CeKafkaBinaryEncodingDeserializer extends IncomingRequestDeserializer {
  readonly dataEncodingParsers: Record<string, (data: any) => unknown> = {
    // 'application/json': (data: any) => JSON.parse(data as string) as unknown,
    'application/json': (data: any) => data as unknown, // data is already parsed by kafka transport
  };

  canDeserialize(kafkaRequest: KafkaRequest): boolean {
    const headers = kafkaRequest.headers as Record<string, string>;
    const contentType = headers['content-type'] ?? '';
    return /application\/.*/.test(contentType);
  }

  normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    const normalizedHeaders: Record<string, string> = {};
    Object.keys(headers).forEach((k) => {
      if (k.startsWith('ce_')) {
        normalizedHeaders[k.replace(/^ce_/, '')] = headers[k];
      }
    });
    return normalizedHeaders;
  }

  mapToSchema(
    kafkaRequest: KafkaRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: Record<string, any>,
  ): IncomingRequest | IncomingEvent {
    if (!this.canDeserialize(kafkaRequest)) {
      return {
        pattern: undefined,
        data: undefined,
      };
    }

    const contentType = kafkaRequest.headers['content-type'] as string;
    const dataEncodingParser = this.dataEncodingParsers[contentType];

    if (dataEncodingParser === undefined) {
      return {
        pattern: undefined,
        data: undefined,
      };
    }

    const headers = this.normalizeHeaders(
      kafkaRequest.headers as Record<string, string>,
    );

    return {
      pattern: headers['type'],
      data: {
        ...headers,
        data: dataEncodingParser(kafkaRequest.value),
      },
    };
  }
}
