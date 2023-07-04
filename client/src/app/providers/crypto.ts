export class _Crypto {
    // format: a74b5d5f-170a-4c79-ae7d-1c9b9f42b0f7
    public static randomUUID(): string {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);

        return (
            bytes[0].toString(16) +
            bytes[1].toString(16) +
            bytes[2].toString(16) +
            bytes[3].toString(16) +
            '-' +
            bytes[4].toString(16) +
            bytes[5].toString(16) +
            '-' +
            bytes[6].toString(16) +
            bytes[7].toString(16) +
            '-' +
            bytes[8].toString(16) +
            bytes[9].toString(16) +
            '-' +
            bytes[10].toString(16) +
            bytes[11].toString(16) +
            bytes[12].toString(16) +
            bytes[13].toString(16) +
            bytes[14].toString(16) +
            bytes[15].toString(16)
        );
    }
}
