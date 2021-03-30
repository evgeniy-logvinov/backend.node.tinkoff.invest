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
  private step = 4;

  private previousVolumes: Set<number> = new Set();

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

  public async sellLogic(minAsk: number): Promise<OperationInfo> {
    if (this.operationInfo.marketInstrument && this.operationInfo.marketInstrument.figi) {
      const hasPlacedOrderByTicket = await TinkoffOrderService.hasPlacedOrderByTicket(this.operationInfo.marketInstrument.figi, 'Sell');
      if (!hasPlacedOrderByTicket)
        await this.startCheckMinAsk(minAsk);
      else
        this.logs('Has tickets Sell');

    }

    return this.operationInfo;

  }

  private isCurrentSellPriceMoreThanBuy(minAsk: number): boolean {
    const buyPrice = this.operationInfo.buyPrice;
    const buyComission = InvestorService.getInvestorComission(buyPrice);
    const sellPrice = this.getPrice(minAsk);
    const sellComission = InvestorService.getInvestorComission(sellPrice);
    const sellSumm = sellPrice + sellComission;
    const buySumm = buyPrice + buyComission;
    this.logs(`S: ${sellSumm} | B: ${buySumm}`);

    if (sellSumm > buySumm) this.logs('Not usefull order');

    return sellSumm > buySumm;
  }

  private async startCheckMinAsk(minAsk: number) {
    if (!this.isCurrentSellPriceMoreThanBuy(minAsk))
      return;

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

      if (this.previousVolumes.size >= this.step) {
        this.logs(`Previous volumes less than step. PreviousVolumes ${[...this.previousVolumes]} Step: ${this.step}`);
        this.previousVolumes.clear();
        const price = this.getPrice(minAsk);
        await this.sell(price);
      }
    }

    this.logs(`Min ask ${minAsk} ${[...this.previousVolumes]}`);
  }

  private getPrice(price: number): number {
    return +(price + this.getMinPriceIncrement()).toFixed(2);
  }

  private getMinPriceIncrement = () => {
    return this.operationInfo.marketInstrument && this.operationInfo.marketInstrument.minPriceIncrement || 0;
  }

  public async sell(price: number = 10) {
    if (this.operationInfo.marketInstrument) {
      try {
        this.operationInfo.sellPrice = price;
        const placedLimitOrder: PlacedLimitOrder | undefined = await TinkoffOrderService.createLimitOrder('Sell', this.operationInfo.marketInstrument, 1, this.operationInfo.sellPrice);
        if (placedLimitOrder)
          this.operationInfo.sellOrderId = placedLimitOrder.orderId || '';
        else
          throw Error('Order not created');

        this.logs(`Ticket created order ${price}`);
        await DBService.sellInstrument(this.operationInfo);
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }
  }

  private logs = (str: string) => {
    if (this.operationInfo.marketInstrument) {
      const logsString = this.operationInfo.marketInstrument.ticker + '    '.slice(0, 4 - this.operationInfo.marketInstrument.ticker.length);
      console.log(`${logsString} | `, str);
    }
  }
}

export default TinkoffSellService;
