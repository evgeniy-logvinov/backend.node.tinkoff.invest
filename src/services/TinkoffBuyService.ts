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
import { PlacedLimitOrder } from '@tinkoff/invest-openapi-js-sdk';
import DBService from './DBService';
import TinkoffOrderService from './TinkoffOrderService';
import HelperService from './HelperService';
import InvestorService from './InvestorService';
import { OperationInfo } from './TinkoffService';

class TinkoffBuyService {
    private step = 0;

    private previousVolumes: Set<number> = new Set();

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
      operationType: 'Buy',
    }

    constructor(operationInfo: OperationInfo) {
      this.operationInfo = operationInfo;
    }

    public async buyLogic(maxBid: number): Promise<OperationInfo> {
      if (!this.operationInfo.buy.limitOrderId) {
        this.startCheckMaxBid(maxBid);
      } else {
        const hasPlacedOrder = await TinkoffOrderService.hasPlacedOrder(this.operationInfo.buy.limitOrderId);
        if (!hasPlacedOrder) {
          if (this.operationInfo.marketInstrument) {
            this.operationInfo.buy.comission = InvestorService.getInvestorComission(this.operationInfo.buy.price);
            await DBService.buyInstrument(this.operationInfo);
            this.operationInfo.operationType = 'Sell';
            this.operationInfo.buy.limitOrderId = '';
            console.log('Buy!');
          }
        }
      }

      return this.operationInfo;
    }

    private startCheckMaxBid(maxBid: number) {
      if (!this.operationInfo.fixedVolume) {
        this.operationInfo.fixedVolume = maxBid;
      } else {
        // console.log('--->>', this.fixedVolume, x.bids[0][0], this.previousVolumes.size, this.fixedVolume >= x.bids[0][0]);
        if (this.operationInfo.fixedVolume > maxBid) {
          this.operationInfo.fixedVolume = maxBid;
          this.previousVolumes.clear();
        } else if (this.operationInfo.fixedVolume < maxBid) {
          const maxElement = [...this.previousVolumes].find(el => el > maxBid);
          if (!maxElement)
            this.previousVolumes.add(maxBid);
        }
        if (this.previousVolumes.size >= this.step) {
          const price = +(maxBid + this.getMinPriceIncrement()).toFixed(2);
          this.buy(price);
          console.log('Buy');
        }
      }
      console.log('this.fixedVolume', this.operationInfo.fixedVolume);
    }

    public async buy(price: number = 10) {
      if (this.operationInfo.marketInstrument) {
        try {
          this.operationInfo.buy.price = price;
          console.log('price', price);
          const placedLimitOrder: PlacedLimitOrder | undefined = await TinkoffOrderService.createLimitOrder('Buy', this.operationInfo.marketInstrument, 1, this.operationInfo.buy.price);
          if (placedLimitOrder)
            this.operationInfo.buy.limitOrderId = placedLimitOrder.orderId || '';
          else
            throw Error('Order not created');

        } catch (err) {
          HelperService.errorHandler(err);
        }
      }
    }

    private getMinPriceIncrement = () => {
      return this.operationInfo.marketInstrument && this.operationInfo.marketInstrument.minPriceIncrement || 0;
    }
}

export default TinkoffBuyService;
