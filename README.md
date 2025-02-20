> [!WARNING]
> This project is a proof concept and is not intended for production use.


## Proof of concept to consume cloud events in NestJS

This project aims to ease the consumption of cloud events from Kafka in NestJS customizing the transport strategy of the microservice.
Default implementation of Kafka transport uses the pattern defined in the @EventPattern decorator as the topic name.
In this proof of concept, the pattern defined is the cloud event type.

The implementation is based on [v1.0.2 of the Kafka protocol binding](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/bindings/kafka-protocol-binding.md) of the CloudEvents specification.
It is made by two parts:

- A custom transport strategy to consume cloud events from a configured kafka topic
- A custom deserializer to deserialize cloud events from kafka messages


## Usage


### Setup

Instantiate the microservice with the custom transport strategy and deserializer:

```typescript
const microservice = await NestFactory.createMicroservice(AppModule, {
  // provide a custom transport strategy to consume cloud events from a configured kafka topic
  strategy: new CeTransportStrategy({
    topics: ['cloud-events'],
    // provide a custom deserializer to deserialize cloud events from kafka messages
    deserializer: new CeRequestDeserializer(),
  }),
});
```

Three different deserializers are provided:

- CeKafkaBinaryEncodingDeserializer: deserializes cloud events in **binary** encoding
- CeKafkaStructuredEncodingDeserializer: deserializes cloud events in **structured** encoding
- CeRequestDeserializer: deserializes cloud events in both **binary** and **structured** encoding


### Controller

The controller is defined as usual, but the pattern is the cloud event type:

```typescript

@Controller()
export class MyController {
  @EventPattern('ce.order.created')
  handleOrderCreated() {
    // handle the event
  }
}
```


## Quick start

### Start kafka

```bash
docker-compose up -d
```

### Start the microservice

```bash
yarn
yarn start:dev
```

### Produce cloud events

_Binary encoding:_
```bash
echo '{
"specversion": "1.0",
"type": "ce.order.created", 
"source": "ce.order.aggregate", 
"datacontenttype": "application/json", 
"data": "{\"orderId\": \"123\", \"customer\": \"John Doe\"}"
}' | kaf produce cloud-events --input-mode full --header content-type:application/cloudevents+json 
```

_Structured encoding:_
```bash
echo '{"orderId": "123", "reason": "Insufficient funds"}' | kaf produce cloud-events \
  --header content-type:application/json \
  --header ce_type:ce.order.deleted \
  --header ce_source:ce.order.aggregate \
  --header ce_specversion:1.0
```