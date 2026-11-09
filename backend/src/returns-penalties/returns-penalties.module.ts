import { Module } from '@nestjs/common';
import { ReturnsPenaltiesService } from './returns-penalties.service';
import { ReturnsPenaltiesController } from './returns-penalties.controller';

@Module({
  controllers: [ReturnsPenaltiesController],
  providers: [ReturnsPenaltiesService],
  exports: [ReturnsPenaltiesService],
})
export class ReturnsPenaltiesModule {}
