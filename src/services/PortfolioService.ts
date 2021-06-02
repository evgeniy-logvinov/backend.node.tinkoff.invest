/**
 * Copyright (c) evgeniy.logvinov.k
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import api from './ApiService';
import { MarketInstrumentList, PortfolioPosition } from '@tinkoff/invest-openapi-js-sdk';
import HelperService from './HelperService';

class PortfolioService {

    public sandboxClear = async () => {
      try {
        await api.sandboxClear();
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }

    public setCurrenciesBalance = async (currency: 'USD' | 'EUR', balance: number) => {
      try {
        await api.setCurrenciesBalance({currency, balance});
        console.log('set currencies result', currency, balance); // 1000$ на счет
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }

    public getPortfolio = async () => {
      try {
        const res = await api.portfolio();
        console.log('portfolio', res);
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }

    public getPortfolioCurrencies = async () => {
      try {
        const res = await api.portfolioCurrencies();
        console.log('get portfolio currencies', res);
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }

    public getInstrumentPortfolio = async (ticker: string): Promise<PortfolioPosition | null> => {
    // public getInstrumentPortfolio = async ({figi}: MarketInstrument) => {
      return await api.instrumentPortfolio({ ticker });
    }

    public stocks = async (): Promise<MarketInstrumentList | undefined>  => {
      try {
        return await api.stocks();
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }

}

export default PortfolioService;
