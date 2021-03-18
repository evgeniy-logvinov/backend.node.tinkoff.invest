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
// import api from './ApiService';
import { MarketInstrument } from '@tinkoff/invest-openapi-js-sdk';
import InvestorService from './InvestorService';
import {BuyObject} from './TinkoffBuyService';

class TinkoffSellService {

    private marketInstrument: MarketInstrument | null = null;

    private buyOperation: BuyObject = {
      volume: 0,
      placedLimitOrderId: '',
      fixedVolume: 0,
    }

    constructor(buyOperation: BuyObject, marketInstrument: MarketInstrument) {
      this.buyOperation = buyOperation;
      this.marketInstrument = marketInstrument;
    }

    public sellLogic(maxAsk: number) {
      console.log('Start Sell', maxAsk);
      if (maxAsk > this.buyOperation.volume + InvestorService.getInvestorComission(this.buyOperation.volume))
        console.log('Bigger!!!!!!!!! You ready to sell this');

    }
}

export default TinkoffSellService;
