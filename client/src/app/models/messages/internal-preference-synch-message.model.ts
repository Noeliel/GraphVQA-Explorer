import { PrefsType } from "src/app/entities/preferences/prefscachingportal";

export interface InternalPreferenceSynchMessage {
    issuer_key: string;
    new_prefs: PrefsType;
}
