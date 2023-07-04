export class Point2D {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public euclideanDistanceTo(other_point: Point2D) {
        return Math.sqrt(
            Math.pow(other_point.x - this.x, 2) +
                Math.pow(other_point.y - this.y, 2)
        );
    }

    public unitVector(): Point2D {
        const len = Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
        return new Point2D(this.x / len, this.y / len);
    }
}
