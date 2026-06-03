export abstract class PlatformEvent {
  public readonly eventId: string;
  public readonly timestamp: Date;
  public readonly traceId?: string;

  constructor(
    public readonly eventName: string,
    public readonly senderService: string,
    traceId?: string,
  ) {
    // Generate a unique identifier for this event instance
    // Since uuid is a common package, we can use standard Date/random fallback or standard uuidv4 dynamically
    this.eventId =
      typeof require !== 'undefined'
        ? require('crypto').randomUUID()
        : Math.random().toString(36).substring(2);
    this.timestamp = new Date();
    this.traceId = traceId;
  }
}
