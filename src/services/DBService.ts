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

interface Buy {
  figi: string;
  buyVolume: number;
  buyComission: number;
  placedLimitOrderId: string;
}

interface Sell {
  figi: string;
  sellVolume: number;
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

  public async buyInstrument(buy: Buy) {
    try {
      await InstrumentHistory().insert(buy);
    } catch (err) {
      console.log(err);
    }
  }

  public async sellInstrument(sell: Sell) {
    try {
      await InstrumentHistory().where('figi', sell.figi).whereNull('sellVolume').update({sellVolume: sell.sellVolume});
    } catch (err) {
      console.log(err);
    }
  }
}

export default new DBService();
