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
import { BillType, OperationInfo } from './ScalpService';

interface HistoryBuy {
  figi: string;
  buyPrice: number;
  buyComission: number;
  buyOrderId: string;
  type: BillType;
}

interface HistorySell {
  figi: string;
  sellPrice: number;
  sellComission: number;
  sellOrderId: string;
  tax: number;
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

  public async buyInstrument(figi: string, operationInfo: OperationInfo, type: BillType) {
    const buyComission = type === 'investor'
      ? InvestorService.getInvestorComission(operationInfo.buyPrice)
      : InvestorService.getTraderComission(operationInfo.buyPrice);

    const historyBuy: HistoryBuy = {
      buyComission,
      type,
      figi,
      ...operationInfo,
    };

    try {
      await InstrumentHistory().insert(historyBuy);
    } catch (err) {
      console.log(err);
    }
  }

  public async getCurrentOrder(figi: string): Promise<any> {
    return await InstrumentHistory()
        .where('figi', figi)
        // .where('type', operationInfo.type)
        .whereNull('sellOrderId')
        .orderBy('createdAt', 'desc')
        .first();
  }

  public async sellInstrument(figi: string, operationInfo: OperationInfo, type: BillType) {
    const sellComission = type === 'investor'
      ? InvestorService.getInvestorComission(operationInfo.sellPrice)
      : InvestorService.getTraderComission(operationInfo.sellPrice);

    const buyComission = type === 'investor'
      ? InvestorService.getInvestorComission(operationInfo.buyPrice)
      : InvestorService.getTraderComission(operationInfo.buyPrice);

    const historySell: HistorySell = {
      figi,
      sellComission: sellComission,
      tax: InvestorService.getTax(operationInfo.sellPrice, sellComission, operationInfo.buyPrice, buyComission),
      ...operationInfo,
    };
    try {
      if (operationInfo.buyOrderId) {
        await InstrumentHistory().where('buyOrderId', operationInfo.buyOrderId).update(historySell);
      } else {
        const order = await InstrumentHistory()
            .where('figi', historySell.figi)
            .where('type', type)
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
