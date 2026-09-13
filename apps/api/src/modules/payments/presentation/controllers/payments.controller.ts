import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayloadVo } from '../../../auth/domain/value-objects/jwt-payload.vo';
import { PaymentsService } from '../../application/use-cases/payments.service';
import { verifyStripeSignature } from '../../domain/webhook-signature';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly payments: PaymentsService,
    private readonly config: ConfigService,
  ) {}

  @Post('intent/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Open the payment for an order',
    description:
      'Returns the clientSecret Stripe.js needs in the browser. Card details go from the ' +
      'browser straight to Stripe and never pass through here.',
  })
  createIntent(@CurrentUser() user: JwtPayloadVo, @Param('orderId') orderId: string) {
    return this.payments.createIntent(orderId, user.sub);
  }

  @Get('status/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Whether my order is paid' })
  status(@CurrentUser() user: JwtPayloadVo, @Param('orderId') orderId: string) {
    return this.payments.statusFor(orderId, user.sub);
  }

  /**
   * Lo que Stripe nos cuenta.
   *
   * Pública porque tiene que serlo: Stripe llama desde fuera sin token.
   * Lo único que separa un aviso real de alguien escribiendo «ya pagué»
   * es la firma, y por eso se comprueba antes de mirar el contenido.
   *
   * Siempre responde 200 cuando la firma es buena, incluso si el evento
   * no nos interesa. Un error aquí hace que Stripe reintente el mismo
   * aviso durante tres días.
   */
  @Post('webhook')
  @ApiExcludeEndpoint()
  async webhook(@Req() req: any, @Headers('stripe-signature') signature: string) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error('Llegó un webhook de Stripe y falta STRIPE_WEBHOOK_SECRET');
      throw new BadRequestException('Webhooks are not configured');
    }

    // Nest lo entrega como Buffer. La firma se calcula sobre el texto.
    const rawBody: string | undefined = req.rawBody?.toString('utf8');
    if (!rawBody) throw new BadRequestException('Webhook body is missing');

    const fallo = verifyStripeSignature(rawBody, signature ?? '', secret);
    if (fallo) {
      // Se registra porque un fallo aquí significa una de dos cosas: el
      // secreto está mal puesto, o alguien está intentando colar pagos.
      this.logger.warn(`Webhook rechazado: ${fallo}`);
      throw new BadRequestException('Invalid signature');
    }

    const event = JSON.parse(rawBody);
    const resultado = await this.payments.handleEvent(event);
    return { received: true, ...resultado };
  }
}
