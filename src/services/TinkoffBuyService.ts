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
import { MarketInstrument, OperationType, PlacedLimitOrder } from '@tinkoff/invest-openapi-js-sdk';
import DBService from './DBService';
import TinkoffOrderService from './TinkoffOrderService';
import HelperService from './HelperService';
import InvestorService from './InvestorService';

export interface BuyObject {
  volume: number;
  placedLimitOrderId: string;
  fixedVolume: number;
}

class TinkoffBuyService {
    private step = 0;

    private previousVolumes: Set<number> = new Set();

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

    public async buyLogic(maxBid: number) {
      let operationType: OperationType = 'Buy';
      this.buyOperation.placedLimitOrderId;

      if (!this.buyOperation.placedLimitOrderId) {
        this.startCheckMaxBid(maxBid);
      } else {
        const hasPlacedOrder = await TinkoffOrderService.hasPlacedOrder(this.buyOperation.placedLimitOrderId);
        if (!hasPlacedOrder) {
          if (this.marketInstrument) {
            await DBService.buyInstrument({
              figi: this.marketInstrument.figi,
              buyVolume: this.buyOperation.volume,
              buyComission: InvestorService.getInvestorComission(this.buyOperation.volume), placedLimitOrderId: this.buyOperation.placedLimitOrderId
            });
            operationType = 'Sell';
            this.buyOperation.placedLimitOrderId = '';
            console.log('Buy!');
          }
        }
      }

      return {operationType, buyOperation: this.buyOperation};
    }

    private startCheckMaxBid(maxBid: number) {
      if (!this.buyOperation.fixedVolume) {
        this.buyOperation.fixedVolume = maxBid;
      } else {
        // console.log('--->>', this.fixedVolume, x.bids[0][0], this.previousVolumes.size, this.fixedVolume >= x.bids[0][0]);
        if (this.buyOperation.fixedVolume > maxBid) {
          this.buyOperation.fixedVolume = maxBid;
          this.previousVolumes.clear();
        } else if (this.buyOperation.fixedVolume < maxBid) {
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
      console.log('this.fixedVolume', this.buyOperation.fixedVolume);
    }

    public async buy(price: number = 10) {
      if (this.marketInstrument) {
        try {
          this.buyOperation.volume = price;
          console.log('price', price);
          const placedLimitOrder: PlacedLimitOrder | undefined = await TinkoffOrderService.createLimitOrder('Buy', this.marketInstrument, 1, this.buyOperation.volume);
          if (placedLimitOrder)
            this.buyOperation.placedLimitOrderId = placedLimitOrder.orderId || '';
          else
            throw Error('Order not created');

        } catch (err) {
          HelperService.errorHandler(err);
        }
      }
    }

    private getMinPriceIncrement = () => {
      return this.marketInstrument && this.marketInstrument.minPriceIncrement || 0;
    }
}

export default TinkoffBuyService;
