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
    private step = 0;

    private previousVolumes: Set<number> = new Set();

    private operationInfo: OperationInfo = {
      buy: {
        limitOrderId: '',
        price: 0,
      },
      sell: {
        limitOrderId: '',
        price: 0,
      },
      marketInstrument: undefined,
    }

    constructor(operationInfo: OperationInfo) {
      this.operationInfo = operationInfo;
    }

    public async sellLogic(minAsk: number): Promise<OperationInfo> {
      if (this.operationInfo.marketInstrument && this.operationInfo.marketInstrument.figi) {
        const hasPlacedOrderByTicket = await TinkoffOrderService.hasPlacedOrderByTicket(this.operationInfo.marketInstrument.figi, 'Sell');
        if (!hasPlacedOrderByTicket) {
          console.log('Has not tickets Sell');
          await this.startCheckMinAsk(minAsk);
        } else {
          console.log('Has tickets Buy');
        }
      }

      return this.operationInfo;

    }

    private async startCheckMinAsk(minAsk: number) {
      console.log('Min ask', minAsk, this.previousVolumes);
      if (!this.previousVolumes.size) {
        this.previousVolumes.add(minAsk);
      } else {
        const previousVolumesArray = [...this.previousVolumes];
        const previousVolumesLessThanMinAsk = previousVolumesArray.filter(el => el < minAsk);

        if (previousVolumesLessThanMinAsk.length === previousVolumesArray.length) {
          this.previousVolumes.clear();
          this.previousVolumes.add(minAsk);
        } else if (!previousVolumesLessThanMinAsk.length) {
          this.previousVolumes.add(minAsk);
        }

        console.log('this.previousVolumes', this.previousVolumes);

        if (this.previousVolumes.size >= this.step) {
          console.log(`Previous volumes less than step. PreviousVolumes ${[...this.previousVolumes]} Step: ${this.step}`);
          this.previousVolumes.clear();
          const price = +(minAsk + this.getMinPriceIncrement()).toFixed(2);
          await this.sell(price);
        }
      }
    }

    private getMinPriceIncrement = () => {
      return this.operationInfo.marketInstrument && this.operationInfo.marketInstrument.minPriceIncrement || 0;
    }

    public async sell(price: number = 10) {
      if (this.operationInfo.marketInstrument) {
        try {
          this.operationInfo.sell.price = price;
          const placedLimitOrder: PlacedLimitOrder | undefined = await TinkoffOrderService.createLimitOrder('Sell', this.operationInfo.marketInstrument, 1, this.operationInfo.sell.price);
          if (placedLimitOrder)
            this.operationInfo.sell.limitOrderId = placedLimitOrder.orderId || '';
          else
            throw Error('Order not created');

          console.log('Ticket created order', price);
          await DBService.sellInstrument(this.operationInfo);
        } catch (err) {
          HelperService.errorHandler(err);
        }
      }
    }
}

export default TinkoffSellService;
