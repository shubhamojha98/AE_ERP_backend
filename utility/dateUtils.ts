export const getMonthlyRanges = (
    startDate: Date,
    endDate: Date
) => {
    const ranges = [];
    let current = new Date(startDate);
    current.setDate(1);

    while (current <= endDate) {
        const from = new Date(current);
        const upto = new Date(
            current.getFullYear(),
            current.getMonth() + 1,
            0
        );

        ranges.push({ from, upto });

        current.setMonth(current.getMonth() + 1);
    }
    return ranges;
};
