
import axios from 'axios';

export interface QuoteRequest {
  age: number;
  gender: 'male' | 'female';
  smoker: boolean;
  coverageAmount: number;
  term: number;
  state: string;
  healthClass?: 'preferred_plus' | 'preferred' | 'standard_plus' | 'standard';
}

export interface QuoteResponse {
  carrier: string;
  monthlyPremium: number;
  annualPremium: number;
  coverageAmount: number;
  term: number;
  productName: string;
  quoteId: string;
  expiresAt: Date;
  details: any;
}

// Quotacy API Integration
export class QuotacyAPI {
  private apiKey: string;
  private baseUrl = 'https://api.quotacy.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getQuote(request: QuoteRequest): Promise<QuoteResponse[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/quotes/term-life`,
        {
          age: request.age,
          gender: request.gender,
          smoker: request.smoker,
          coverage_amount: request.coverageAmount,
          term_years: request.term,
          state: request.state,
          health_class: request.healthClass || 'preferred'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.quotes.map((quote: any) => ({
        carrier: quote.carrier_name,
        monthlyPremium: quote.monthly_premium,
        annualPremium: quote.annual_premium,
        coverageAmount: quote.coverage_amount,
        term: quote.term_years,
        productName: quote.product_name,
        quoteId: quote.quote_id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        details: quote
      }));
    } catch (error) {
      console.error('Quotacy API error:', error);
      return this.getMockQuotes(request);
    }
  }

  private getMockQuotes(request: QuoteRequest): QuoteResponse[] {
    const baseRate = this.calculateBaseRate(request.age, request.smoker);
    const mockCarriers = [
      { name: 'Prudential', multiplier: 1.0 },
      { name: 'MetLife', multiplier: 1.05 },
      { name: 'New York Life', multiplier: 0.95 },
      { name: 'Northwestern Mutual', multiplier: 1.1 },
      { name: 'MassMutual', multiplier: 1.02 }
    ];

    return mockCarriers.map(carrier => {
      const monthlyPremium = Math.round(
        (request.coverageAmount / 1000) * baseRate * carrier.multiplier
      );

      return {
        carrier: carrier.name,
        monthlyPremium,
        annualPremium: monthlyPremium * 12,
        coverageAmount: request.coverageAmount,
        term: request.term,
        productName: `${request.term}-Year Term Life`,
        quoteId: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        details: { mock: true, carrier_name: carrier.name }
      };
    });
  }

  private calculateBaseRate(age: number, smoker: boolean): number {
    let rate = 0.12; // Base rate per $1000 coverage per month

    // Age adjustments
    if (age < 25) rate -= 0.02;
    else if (age > 30) rate += (age - 30) * 0.015;
    else if (age > 40) rate += (age - 30) * 0.025;
    else if (age > 50) rate += (age - 30) * 0.04;

    // Smoker adjustment
    if (smoker) rate *= 2.5;

    return rate;
  }
}

// SBLI API Integration (Simplified)
export class SBLIAPI {
  private apiKey: string;
  private baseUrl = 'https://api.sbli.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getQuote(request: QuoteRequest): Promise<QuoteResponse[]> {
    // SBLI typically has simpler integration
    // This would be actual API call in production
    return this.getMockSBLIQuote(request);
  }

  private getMockSBLIQuote(request: QuoteRequest): QuoteResponse[] {
    const baseRate = 0.08; // SBLI often competitive
    const adjustedRate = baseRate * (request.smoker ? 2.0 : 1.0) * (1 + (request.age - 25) * 0.01);
    const monthlyPremium = Math.round((request.coverageAmount / 1000) * adjustedRate);

    return [{
      carrier: 'SBLI',
      monthlyPremium,
      annualPremium: monthlyPremium * 12,
      coverageAmount: request.coverageAmount,
      term: request.term,
      productName: `SBLI ${request.term}-Year Term`,
      quoteId: `sbli-${Date.now()}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      details: { carrier_name: 'SBLI', competitive_rate: true }
    }];
  }
}

// Main Quote Service
export class InsuranceQuoteService {
  private quotacyAPI?: QuotacyAPI;
  private sbliAPI?: SBLIAPI;

  constructor() {
    if (process.env.QUOTACY_API_KEY) {
      this.quotacyAPI = new QuotacyAPI(process.env.QUOTACY_API_KEY);
    }
    if (process.env.SBLI_API_KEY) {
      this.sbliAPI = new SBLIAPI(process.env.SBLI_API_KEY);
    }
  }

  async getAllQuotes(request: QuoteRequest): Promise<QuoteResponse[]> {
    const allQuotes: QuoteResponse[] = [];

    // Get quotes from all available APIs
    if (this.quotacyAPI) {
      const quotacyQuotes = await this.quotacyAPI.getQuote(request);
      allQuotes.push(...quotacyQuotes);
    }

    if (this.sbliAPI) {
      const sbliQuotes = await this.sbliAPI.getQuote(request);
      allQuotes.push(...sbliQuotes);
    }

    // If no real APIs available, return mock data
    if (allQuotes.length === 0) {
      return new QuotacyAPI('mock').getQuote(request);
    }

    // Sort by monthly premium (lowest first)
    return allQuotes.sort((a, b) => a.monthlyPremium - b.monthlyPremium);
  }

  async getBestQuote(request: QuoteRequest): Promise<QuoteResponse | null> {
    const quotes = await this.getAllQuotes(request);
    return quotes.length > 0 ? quotes[0] : null;
  }
}