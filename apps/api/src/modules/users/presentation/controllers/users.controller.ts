import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { JwtPayloadVo } from '../../../auth/domain/value-objects/jwt-payload.vo';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly getProfile: GetProfileUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  profile(@CurrentUser() user: JwtPayloadVo) {
    return this.getProfile.execute(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  update(@CurrentUser() user: JwtPayloadVo, @Body() dto: UpdateProfileDto) {
    return this.updateProfile.execute(user.sub, dto);
  }
}
