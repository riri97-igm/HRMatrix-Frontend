export const getCurrency = (country: string): string => {
  switch (country) {
    case 'Singapore':
      return 'SGD';
    case 'Myanmar':
      return 'MMK';
    default:
      return 'MMK';
  }
};

export const formatCurrency = (amount: number, country: string): string => {
  const currency = getCurrency(country);
  return `${currency} ${amount.toLocaleString()}`;
};