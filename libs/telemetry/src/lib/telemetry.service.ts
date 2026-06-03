import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { trace, SpanStatusCode } from '@opentelemetry/api';

@Injectable()
export class TelemetryService implements OnModuleInit {
  private readonly logger = new Logger(TelemetryService.name);
  private sdk!: NodeSDK;

  onModuleInit() {
    this.sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter({
        url:
          process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
          'http://localhost:4318/v1/traces',
      }),
      metricReader: new PrometheusExporter({
        port: Number(process.env.OTEL_METRIC_PORT) || 9464,
      }),
      serviceName: process.env.OTEL_SERVICE_NAME || 'erp-service',
    });

    this.sdk.start();
    this.logger.log('OpenTelemetry SDK initialized');
  }

  getTracer(name = 'erp-platform') {
    return trace.getTracer(name);
  }
}

export function Traced(spanName?: string): MethodDecorator {
  return (target, key, descriptor: TypedPropertyDescriptor<any>) => {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const tracer = trace.getTracer('erp-platform');
      return tracer.startActiveSpan(spanName ?? String(key), async (span) => {
        try {
          span.setAttributes({ service: target.constructor.name });
          const result = await original.apply(this, args);
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (err) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (err as Error).message,
          });
          span.recordException(err as Error);
          throw err;
        } finally {
          span.end();
        }
      });
    };
    return descriptor;
  };
}
