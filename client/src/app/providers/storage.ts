export class StorageProvider {
    private static storage = localStorage;

    constructor() {}

    public static fetchObject<T>(key: string): T | undefined {
        const data = this.storage.getItem(key);
        if (!data) return undefined;
        return JSON.parse(data) as T;
    }

    public static storeObject<T>(key: string, object: T) {
        const data = JSON.stringify(object);
        this.storage.setItem(key, data);
    }

    public static resetObject<T>(key: string) {
        this.storage.removeItem(key);
    }
}
