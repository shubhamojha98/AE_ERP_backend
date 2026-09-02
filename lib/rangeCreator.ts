
export function rangeCreator(lower: number, upper: number) {
    return [...Array(upper - lower + 1).keys()].map(i => lower + i);
}