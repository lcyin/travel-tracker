import { Injectable } from '@nestjs/common';
import { getCurrencyCodes } from './helpers/currency.helper';
@Injectable()
export class CurrencyService {
  private readonly currencyCodes = getCurrencyCodes();
  findAll() {
    return this.currencyCodes;
  }
}
