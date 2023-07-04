import { Subscription } from 'rxjs';
import { InternalPreferenceSynchMessage } from 'src/app/models/messages/internal-preference-synch-message.model';
import { _Crypto } from 'src/app/providers/crypto';
import { MBChannel, MessageBusService } from 'src/app/providers/message-bus';
import { StorageProvider } from 'src/app/providers/storage';

export type PrefsType = {
    [key: string]: any;
};

export abstract class PrefsCachingPortal {
    private issuer_key = _Crypto.randomUUID();
    private internal_sync_subscription: Subscription | undefined;

    protected prefs: PrefsType = {};

    protected autoFetch: boolean;
    protected _fetchDidSucceed = false;
    protected autoPush: boolean;

    private changeSubscriptions: {
        [subscription_key: string]: {
            self_notify: boolean;
            callback: () => void;
        };
    } = {};

    constructor(autoFetch = true, autoPush = true) {
        this.autoFetch = autoFetch;
        this.autoPush = autoPush;

        this.setupDefaults();

        if (autoFetch) {
            this.synchronizePreferencesFromStorage();
            this.setupPortalSubscription();
        }
    }

    /**
     * Set up default preference keys & values.
     */
    protected abstract setupDefaults(): void;

    protected abstract getPrefsKey(): string;

    protected getPref(key: string): any {
        return this.prefs[key];
    }

    protected setPref(key: string, value: any) {
        this.prefs[key] = value;

        if (this.autoPush) {
            this.synchronizePreferencesToStorage();
            this.notifyPortalsAboutChanges();
        }
    }

    private synchronizePreferencesFromStorage() {
        const new_prefs = StorageProvider.fetchObject<PrefsType>(
            this.getPrefsKey()
        );

        if (new_prefs) {
            // todo: figure out diffs
            this.prefs = new_prefs;
            this._fetchDidSucceed = true;
        }
    }

    private synchronizePreferencesToStorage() {
        StorageProvider.storeObject<PrefsType>(this.getPrefsKey(), this.prefs);
    }

    private setupPortalSubscription() {
        this.internal_sync_subscription =
            MessageBusService.subscribe<InternalPreferenceSynchMessage>(
                MBChannel.INTERNALPREFSYNC,
                this.getPrefsKey(),
                {
                    next: (message) => {
                        // todo: consider reading from StorageProvider instead?
                        if (message.issuer_key != this.issuer_key) {
                            this.prefs = message.new_prefs;
                            this.notifySubscribersAboutChanges(false);
                        } else {
                            this.notifySubscribersAboutChanges(true);
                        }
                    },
                }
            );
    }

    private teardownPortalSubscription() {
        if (this.internal_sync_subscription) {
            this.internal_sync_subscription.unsubscribe();
            this.internal_sync_subscription = undefined;
        }
    }

    private notifyPortalsAboutChanges() {
        MessageBusService.publish<InternalPreferenceSynchMessage>(
            MBChannel.INTERNALPREFSYNC,
            this.getPrefsKey(),
            {
                issuer_key: this.issuer_key,
                new_prefs: this.prefs,
            }
        );
    }

    public subscribeToPreferenceChanges(
        subscription_key: string,
        callback: () => void,
        notify_about_own_updates: boolean
    ) {
        this.changeSubscriptions[subscription_key] = {
            self_notify: notify_about_own_updates,
            callback: callback,
        };
    }

    public unsubscribeFromPreferenceChanges(subscription_key: string) {
        delete this.changeSubscriptions[subscription_key];
    }

    /**
     * Notify owner of prefs portal about changed preferences.
     */
    private notifySubscribersAboutChanges(is_self_update: boolean) {
        Object.values(this.changeSubscriptions).forEach((entry) => {
            if (entry.self_notify || !is_self_update) entry.callback();
        });
    }
}
