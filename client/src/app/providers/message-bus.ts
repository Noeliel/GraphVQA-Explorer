import { PartialObserver, Subscription } from 'rxjs';
import Rxmq from 'rxmq';
import { Message, MessageSubject } from 'src/app/models/messages/message.model';

export enum MBChannel {
    VISIBILITY = 0,
    FILTER = 1,
    UI = 2,
    WEIGHT = 3,
    DISPLAYMODE = 4,
    INTERNALPREFSYNC = 5,
}

export class MessageBusService {
    private static channels = new Map([
        [MBChannel.VISIBILITY, Rxmq.channel('visibility')],
        [MBChannel.FILTER, Rxmq.channel('filter')],
        [MBChannel.UI, Rxmq.channel('ui')],
        [MBChannel.WEIGHT, Rxmq.channel('weight')],
        [MBChannel.DISPLAYMODE, Rxmq.channel('displaymode')],
        [MBChannel.INTERNALPREFSYNC, Rxmq.channel('internalprefsync')],
    ]);

    constructor() {}

    public static publish<T extends Message>(
        channel: MBChannel,
        subject: MessageSubject | string,
        message: T
    ) {
        MessageBusService.channels.get(channel)?.subject(subject).next(message);
    }

    public static subscribe<T extends Message>(
        channel: MBChannel,
        subject: MessageSubject | string,
        handler: PartialObserver<T>
    ): Subscription | undefined {
        return MessageBusService.channels
            .get(channel)?.observe(subject)
            .subscribe(handler as PartialObserver<unknown>) as Subscription | undefined;
    }
}
