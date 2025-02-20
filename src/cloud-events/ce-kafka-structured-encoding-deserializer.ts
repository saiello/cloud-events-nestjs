import { IncomingRequestDeserializer } from '@nestjs/microservices/deserializers';
import { KafkaRequest } from '@nestjs/microservices/serializers';
import { IncomingEvent, IncomingRequest } from '@nestjs/microservices';

/**
 * Deserialize cloud events from stryctured encoding kafka messages
 * see: https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/bindings/kafka-protocol-binding.md
 *
 * /*
 *     ------------------ Message -------------------
 *     Topic Name: mytopic
 *     ------------------- key ----------------------
 *     Key: mykey
 *     ------------------ headers -------------------
 *     content-type: application/cloudevents+json; charset=UTF-8
 *     ------------------- value --------------------
 *     {
 *         "specversion" : "1.0",
 *         "type" : "com.example.someevent",
 *         "source" : "/mycontext/subcontext",
 *         "id" : "1234-1234-1234",
 *         "time" : "2018-04-05T03:56:24Z",
 *         "datacontenttype" : "application/xml",
 *
 *         ... further attributes omitted ...
 *
 *         "data" : {
 *             ... application data encoded in XML ...
 *         }
 *     }
 *     -----------------------------------------------
 */
export class CeKafkaStructuredEncodingDeserializer extends IncomingRequestDeserializer {
  canDeserialize(kafkaRequest: KafkaRequest): boolean {
    const headers = kafkaRequest.headers as Record<string, string>;
    const contentType = headers['content-type'] ?? '';
    return /application\/cloudevents.*/.test(contentType);
  }

  mapToSchema(
    kafkaRequest: KafkaRequest,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _options?: Record<string, any>,
  ): IncomingRequest | IncomingEvent {
    if (!this.canDeserialize(kafkaRequest)) {
      return {
        pattern: undefined,
        data: undefined,
      };
    }
    const value = kafkaRequest.value as Record<string, any>;
    const eventType = value.type as string;

    // parse data
    const datacontentType = value.datacontenttype as string;
    if (datacontentType && /application\/json.*/.test(datacontentType)) {
      const data = JSON.parse(value.data as string) as Record<string, any>;
      return {
        pattern: eventType,
        data: {
          ...value,
          data,
        },
      };
    }

    return {
      pattern: undefined,
      data: undefined,
    };
  }
}
