import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { JwtPayloadVo } from '../../../auth/domain/value-objects/jwt-payload.vo';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
  ) {}

  @Get('me')
  profile(@CurrentUser() user: JwtPayloadVo) {
    return this.getProfile.execute(user.sub);
  }

  @Patch('me')
  update(@CurrentUser() user: JwtPayloadVo, @Body() dto: UpdateProfileDto) {
    return this.updateProfile.execute(user.sub, dto);
  }
}
