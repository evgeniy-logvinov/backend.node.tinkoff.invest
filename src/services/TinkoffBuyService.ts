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
import { OperationInfo } from './TinkoffService';

class TinkoffBuyService {
    private step = 4;

    private previousVolumes: Set<number> = new Set();

    private currentMaxBid: number = 0;

    private operationInfo: OperationInfo = {
      buyOrderId: '',
      buyPrice: 0,
      sellOrderId: '',
      sellPrice: 0,
      marketInstrument: undefined,
    }

    constructor(operationInfo: OperationInfo) {
      this.operationInfo = operationInfo;
    }

    public async buyLogic(maxBid: number): Promise<OperationInfo> {
      if (this.operationInfo.marketInstrument && this.operationInfo.marketInstrument.figi) {
        const hasPlacedOrderByTicket = await TinkoffOrderService.hasPlacedOrderByTicket(this.operationInfo.marketInstrument.figi, 'Buy');
        if (!hasPlacedOrderByTicket)
          await this.startCheckMaxBid(maxBid);
        else
          this.logs(`Has tickets Buy`);

      }

      return this.operationInfo;
    }

    private async startCheckMaxBid(maxBid: number) {
      if (!this.currentMaxBid) {
        this.currentMaxBid = maxBid;
      } else {
        if (this.currentMaxBid > maxBid)
          this.currentMaxBid = maxBid;

        if (this.currentMaxBid + this.step * this.getMinPriceIncrement() < maxBid) {
          this.logs(`Start buy. Current maxBid ${this.currentMaxBid} + ${this.step * this.getMinPriceIncrement()} ${maxBid}`);
          this.currentMaxBid = 0;
          const price = +(maxBid + this.getMinPriceIncrement()).toFixed(2);
          await this.buy(price);
        }
      }

      this.logs(`Max bid: ${maxBid} | ${[...this.previousVolumes]}`);
    }

    private async startCheckMaxBidByStep(maxBid: number) {
      if (!this.previousVolumes.size) {
        this.previousVolumes.add(maxBid);
      } else {
        const previousVolumesArray = [...this.previousVolumes];
        const previousVolumesMoreThanMaxBid = previousVolumesArray.filter(el => el > maxBid);

        if (previousVolumesMoreThanMaxBid.length === previousVolumesArray.length) {
          this.previousVolumes.clear();
          this.previousVolumes.add(maxBid);
        } else if (!previousVolumesMoreThanMaxBid.length) {
          this.previousVolumes.add(maxBid);
        }

        if (this.previousVolumes.size >= this.step) {
          this.logs(`Previous volumes more than step. PreviousVolumes ${[...this.previousVolumes]} Step: ${this.step}`);
          this.previousVolumes.clear();
          const price = +(maxBid + this.getMinPriceIncrement()).toFixed(2);
          await this.buy(price);
        }
      }
      this.logs(`Max bid: ${maxBid} | ${[...this.previousVolumes]}`);
    }

    public async buy(price: number = 10) {
      if (this.operationInfo.marketInstrument) {
        try {
          this.operationInfo.buyPrice = price;
          const placedLimitOrder: PlacedLimitOrder | undefined = await TinkoffOrderService.createLimitOrder('Buy', this.operationInfo.marketInstrument, 1, this.operationInfo.buyPrice);

          if (placedLimitOrder)
            this.operationInfo.buyOrderId = placedLimitOrder.orderId || '';
          else
            throw Error('Order not created');

          this.logs(`Ticket created order ${price}`);
          await DBService.buyInstrument(this.operationInfo);
        } catch (err) {
          HelperService.errorHandler(err);
        }
      }
    }

    private getMinPriceIncrement = () => {
      return this.operationInfo.marketInstrument && this.operationInfo.marketInstrument.minPriceIncrement || 0;
    }

    private logs = (str: string) => {
      if (this.operationInfo.marketInstrument) {
        const logsString = this.operationInfo.marketInstrument.ticker + '    '.slice(0, 4 - this.operationInfo.marketInstrument.ticker.length);
        console.log(`${logsString} |  Buy  |`, str);
      }
    }
}

export default TinkoffBuyService;
