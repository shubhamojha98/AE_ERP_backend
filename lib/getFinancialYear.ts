function getFinancialYear(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // January = 0

    if (month >= 4) {
        // April to December → current year - next year
        return `${year}-${year + 1}`;
    } else {
        // January to March → previous year - current year
        return `${year - 1}-${year}`;
    }
}



export const getFYDateRange = () => {
  const fy = getFinancialYear(); // e.g. "2024-2025"
  const [startYear, endYear] = fy.split("-").map(Number);

  const startDate = new Date(startYear, 3, 1);  // April 1
  const endDate = new Date(endYear, 2, 31, 23, 59, 59); // March 31

  return { startDate, endDate };
};


export default getFinancialYear;