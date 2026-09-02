


// POINT-IN-POLYGON FUNCTION
export default function pointInPolygon(point: [number, number], polygon: [number, number][]) {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];

        // If user is EXACTLY on boundary
        const onBoundary =
            (x - xi) * (yj - yi) === (y - yi) * (xj - xi) &&
            Math.min(xi, xj) <= x && x <= Math.max(xi, xj) &&
            Math.min(yi, yj) <= y && y <= Math.max(yi, yj);

        if (onBoundary) return true;

        const intersect =
            yi > y !== yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }

    return inside;
}
