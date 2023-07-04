export class SimpleLinkedListElement<T> {
    public next?: SimpleLinkedListElement<T>;
    public obj: T;

    constructor (object: T) {
        this.obj = object;
    }
}

export class SimpleLinkedList<T> {
    public head?: SimpleLinkedListElement<T>;
}
