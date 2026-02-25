import { Module } from '@nestjs/common';
import { ObservabilityModule } from './infrastructure/observability/observability.module';

// Módulo compartido — provee clases base, infraestructura común y servicios transversales
@Module({
  imports: [ObservabilityModule],
  controllers: [],
  providers: [],
  exports: [ObservabilityModule],
})
export class SharedModule {}
