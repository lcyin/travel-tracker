import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

interface ConversionResult {
  baseAmount: number;
  exchangeRate: number;
  source: string;
  rateAt: Date;
}

@Injectable()
export class CurrencyConverterService {
  private readonly logger = new Logger(CurrencyConverterService.name);
  private readonly exchangeRateApiKey: string;
  private ratesCache = new Map<string, { rate: number; fetchedAt: Date }>();
  private readonly CACHE_TTL_MINUTES = 60;

  constructor(private configService: ConfigService) {
    this.exchangeRateApiKey =
      this.configService.get('EXCHANGE_RATE_API_KEY') || 'fcu_demo'; // Fallback to demo key
  }

  /**
   * Convert an amount from one currency to another.
   * For matching currencies, returns the amount unchanged with rate 1.0.
   */
  async convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<ConversionResult> {
    if (fromCurrency === toCurrency) {
      return {
        baseAmount: amount,
        exchangeRate: 1.0,
        source: 'no_conversion',
        rateAt: new Date(),
      };
    }

    try {
      const rate = await this.getExchangeRate(fromCurrency, toCurrency);
      const baseAmount = Math.round(amount * rate * 100) / 100;

      return {
        baseAmount,
        exchangeRate: rate,
        source: 'exchange_rate_api',
        rateAt: new Date(),
      };
    } catch (error) {
      this.logger.warn(
        `Failed to fetch exchange rate for ${fromCurrency} -> ${toCurrency}. Using 1.0.`,
        error,
      );

      // Fallback: use rate 1.0 (neutral)
      return {
        baseAmount: amount,
        exchangeRate: 1.0,
        source: 'fallback_rate_1',
        rateAt: new Date(),
      };
    }
  }

  /**
   * Fetch exchange rate from ExchangeRateApi.
   * Caches results to avoid excessive API calls.
   */
  private async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    const cacheKey = `${fromCurrency.toUpperCase()}_${toCurrency.toUpperCase()}`;
    const cached = this.ratesCache.get(cacheKey);

    if (
      cached &&
      Date.now() - cached.fetchedAt.getTime() <
        this.CACHE_TTL_MINUTES * 60 * 1000
    ) {
      return cached.rate;
    }

    try {
      const response = await axios.get(
        'https://api.exchangerate-api.com/v4/latest/' + fromCurrency,
        {
          headers: { Authorization: `Bearer ${this.exchangeRateApiKey}` },
          timeout: 5000, // 5s timeout
        },
      );

      const rate = response.data.rates[toCurrency.toUpperCase()];
      if (!rate) {
        throw new Error(`Rate for ${toCurrency} not found`);
      }

      this.ratesCache.set(cacheKey, { rate, fetchedAt: new Date() });
      return rate;
    } catch (error) {
      this.logger.error(
        `Exchange rate API call failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Clear the exchange rate cache (useful for testing or admin commands).
   */
  clearCache(): void {
    this.ratesCache.clear();
  }
}
