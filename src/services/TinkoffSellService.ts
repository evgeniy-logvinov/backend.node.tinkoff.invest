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
import { PlacedLimitOrder } from '@tinkoff/invest-openapi-js-sdk';
import DBService from './DBService';
import HelperService from './HelperService';
import InvestorService from './InvestorService';
import TinkoffOrderService from './TinkoffOrderService';
import { OperationInfo } from './TinkoffService';

class TinkoffSellService {

    private operationInfo: OperationInfo = {
      buy: {
        limitOrderId: '',
        price: 0,
        comission: 0,
      },
      sell: {
        limitOrderId: '',
        price: 0,
        comission: 0,
      },
      fixedVolume: 0,
      operationType: 'Sell',
      marketInstrument: undefined,
    }

    constructor(operationInfo: OperationInfo) {
      this.operationInfo = operationInfo;
    }

    public async sellLogic(maxAsk: number): Promise<OperationInfo> {
      console.log('Start Sell', maxAsk);
      console.log('maxAsk', maxAsk, 'waitingVolume', this.operationInfo.sell.price + InvestorService.getInvestorComission(this.operationInfo.sell.price));
      if (maxAsk > 0) {
      // if (maxAsk > this.buyOperation.volume + InvestorService.getInvestorComission(this.buyOperation.volume)) {

        console.log('Bigger!!!!!!!!! You ready to sell this');
        this.operationInfo.operationType = 'Buy';
      }

      return this.operationInfo;
    }

    public async sell(price: number = 10) {
      if (this.operationInfo.marketInstrument) {
        try {
          this.operationInfo.sell.price = price;
          console.log('price', price);
          const sellLimitOrder: PlacedLimitOrder | undefined = await TinkoffOrderService.createLimitOrder('Sell', this.operationInfo.marketInstrument, 1, this.operationInfo.sell.price);
          if (sellLimitOrder)
            this.operationInfo.sell.limitOrderId = sellLimitOrder.orderId || '';
          else
            throw Error('Order not created');

        } catch (err) {
          HelperService.errorHandler(err);
        }
      }
    }

}

export default TinkoffSellService;
