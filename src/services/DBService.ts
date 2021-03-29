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
import { MarketInstrument } from '@tinkoff/invest-openapi-js-sdk';
import knex from '../knex';
import InvestorService from './InvestorService';
import { OperationInfo } from './TinkoffService';

interface HistoryBuy {
  figi: string;
  buyPrice: number;
  buyComission: number;
  buyOrderId: string;
}

interface HistorySell {
  figi: string;
  sellPrice: number;
  sellComission: number;
  sellOrderId: string;
}

const Instrument = () => knex('Instrument');
const InstrumentHistory = () => knex('InstrumentHistory');

class DBService {
  async save(marketInstrument: MarketInstrument) {
    try {
      const count = await Instrument().where('figi', marketInstrument.figi).count('figi');
      console.log('marketInstrument', marketInstrument);
      if (count[0].count === '0') {
        console.log(`Ticker ${marketInstrument.ticker} exists`);
        await Instrument().insert({...marketInstrument});
      }
    } catch (err) {
      console.log(err);
    }
  }

  public async buyInstrument(operationInfo: OperationInfo) {
    if (!operationInfo.marketInstrument)
      throw new Error('Market is empty');

    const historyBuy: HistoryBuy = {
      buyComission: InvestorService.getInvestorComission(operationInfo.buy.price),
      buyPrice: operationInfo.buy.price,
      buyOrderId: operationInfo.buy.limitOrderId,
      figi: operationInfo.marketInstrument.figi
    };

    try {
      await InstrumentHistory().insert(historyBuy);
    } catch (err) {
      console.log(err);
    }
  }

  public async getCurrentOrder(operationInfo: OperationInfo): Promise<any> {
    if (!operationInfo.marketInstrument)
      throw new Error('Market is empty');

    return await InstrumentHistory()
        .where('figi', operationInfo.marketInstrument.figi)
        .whereNull('sellOrderId')
        .orderBy('createdAt', 'desc')
        .first();
  }

  public async sellInstrument(operationInfo: OperationInfo) {
    if (!operationInfo.marketInstrument)
      throw new Error('Market is empty');

    const historySell: HistorySell = {
      figi: operationInfo.marketInstrument.figi,
      sellComission: InvestorService.getInvestorComission(operationInfo.sell.price),
      sellOrderId: operationInfo.sell.limitOrderId,
      sellPrice: operationInfo.sell.price,
    };
    try {
      if (operationInfo.buy.limitOrderId) {
        await InstrumentHistory().where('buyOrderId', operationInfo.buy.limitOrderId).update(historySell);
      } else {
        const order = await InstrumentHistory()
            .where('figi', historySell.figi)
            .whereNull('sellOrderId')
            .orderBy('createdAt', 'desc')
            .first();
        await InstrumentHistory().where('id', order.id).update(historySell);
      }
    } catch (err) {
      console.log(err);
    }
  }
}

export default new DBService();
