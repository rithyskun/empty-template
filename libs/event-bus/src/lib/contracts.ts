import { PlatformEvent } from './base.event';

export class UserLoggedInEvent extends PlatformEvent {
  public static readonly EVENT_NAME = 'user.logged_in';

  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly tenantId: string,
    traceId?: string,
  ) {
    super(UserLoggedInEvent.EVENT_NAME, 'identity-service', traceId);
  }
}

export class UserRegisteredEvent extends PlatformEvent {
  public static readonly EVENT_NAME = 'user.registered';

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly tenantId: string,
    traceId?: string,
  ) {
    super(UserRegisteredEvent.EVENT_NAME, 'identity-service', traceId);
  }
}

export class PaymentReceivedEvent extends PlatformEvent {
  public static readonly EVENT_NAME = 'payment.received';

  constructor(
    public readonly paymentId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly tenantId: string,
    traceId?: string,
  ) {
    super(PaymentReceivedEvent.EVENT_NAME, 'payment-service', traceId);
  }
}

export class NotificationSentEvent extends PlatformEvent {
  public static readonly EVENT_NAME = 'notification.sent';

  constructor(
    public readonly notificationId: string,
    public readonly recipient: string,
    public readonly channel: 'EMAIL' | 'SMS' | 'PUSH',
    traceId?: string,
  ) {
    super(NotificationSentEvent.EVENT_NAME, 'notification-service', traceId);
  }
}
