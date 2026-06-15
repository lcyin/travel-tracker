import { getCurrencyCodes } from './currency.helper';

describe('Currency Helper', () => {
  it('should return an array of currency codes', () => {
    const currencyCodes = getCurrencyCodes();
    expect(currencyCodes).toMatchSnapshot();
  });
});
