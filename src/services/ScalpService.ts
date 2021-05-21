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

import { MarketInstrument, OrderResponse, PlacedLimitOrder } from '@tinkoff/invest-openapi-js-sdk';
import DBService from './DBService';
import HelperService from './HelperService';
import InvestorService from './InvestorService';
import OrderService from './OrderService';
import TinkoffService from './TinkoffService';

export type BillType = 'investor' | 'traider';

export interface OperationInfo {
  buyOrderId: string;
  buyPrice: number;
  sellPrice: number;
  sellOrderId: string;
}

type Trend = 'Buy' | 'Sell';

class ScalpService {
  private marketInstrument: MarketInstrument;
  private type: BillType;
  private trend: 'Buy' | 'Sell' = 'Buy';
  private numberOfTickers: number = 1;
  private buyTrendStep: number = 4;
  private sellTrendStep: number = 4;
  private sellValueGap: number = 9;
  private cancelOrderGap: number = 4;
  private price: number = 0;
  private operationInfo: OperationInfo = {
    buyOrderId: '',
    buyPrice: 0,
    sellOrderId: '',
    sellPrice: 0,
  }
  private timerId: NodeJS.Timeout | undefined = undefined;

  constructor(marketInstrument: MarketInstrument, numberOfTickers: number, type: BillType = 'investor') {
    this.marketInstrument = marketInstrument;
    this.type = type;
    this.numberOfTickers = numberOfTickers;
  }

  startUpDownStrategy = async () => {
    try {
      // Do we need to check it here
      this.trend = await this.currentTrend(this.marketInstrument.figi);
      this.logs('Trend:', this.trend);
      // or only here
      const orderbook = await TinkoffService.getOrderbook(this.marketInstrument.figi, 1);

      if (this.trend === 'Buy' && orderbook.bids[0])
        await this.buy(orderbook.bids[0]);
      else if (orderbook.asks[0])
        await this.sell(orderbook.asks[0]);

    } catch (err) {
      HelperService.errorHandler(err);
    } finally {
      this.timerId = setTimeout(this.startUpDownStrategy, 2000);
    }
  };

  start = async () => {
    this.logs(`Start`);
    await this.fillOngoingSell();
    this.timerId = setTimeout(this.startUpDownStrategy, 2000);
  }

  finish = () => {
    this.logs(`Finish`);
    if (this.timerId)
      clearTimeout(this.timerId);
  }

  fillOngoingSell = async (): Promise<void> => {
    const order: any = await DBService.getCurrentOrder(this.marketInstrument.figi);
    this.logs('order',  order);
    if (order) {
      this.operationInfo.buyOrderId = order.buyOrderId;
      this.operationInfo.buyPrice = order.buyPrice;
    } else {
      this.logs('Have not some buy orders');
    }
  }

  isCurrentSellPriceMoreThanBuy = (price: number): boolean => {
    const buyPrice = this.operationInfo.buyPrice;
    const buyComission = this.type === 'investor' ? InvestorService.getInvestorComission(buyPrice) : InvestorService.getTraderComission(buyPrice);
    const sellPrice = this.getPrice(price);
    const sellComission = this.type === 'investor' ? InvestorService.getInvestorComission(sellPrice) : InvestorService.getTraderComission(sellPrice);
    const sellSumm = +((+sellPrice - +sellComission - this.getMinPriceIncrement()).toFixed(2));
    const buySumm = +((+buyPrice + +buyComission).toFixed(2));
    const tax = InvestorService.getTax(sellPrice, sellComission, buyPrice, buyComission);

    this.logs(`sellSumm: ${sellSumm} | buySumm: ${buySumm} | tax: ${tax}`);
    const canSell = sellSumm > buySumm + tax;
    if (!canSell) this.logs(`Not usefull order. Expected more: ${buySumm + tax}`);

    return canSell;
  }

  getPrice = (price: number): number => {
    return +(price - this.getMinPriceIncrement()).toFixed(2);
  }

  currentTrend = async (figi: string): Promise<Trend> => {
    const portfolio = await TinkoffService.getTickerPortfolio(figi);
    this.logs('balance', portfolio?.balance);

    if (!portfolio || portfolio.balance < this.numberOfTickers)
      return 'Buy';
    else if (portfolio.balance > this.numberOfTickers)
      throw Error(`Some problems with balance. Number of Instruments more than expected currentBalance: ${portfolio.balance} numberOfTickers ${this.numberOfTickers}`);

    return 'Sell';
  }

  buy = async ({price}: OrderResponse): Promise<void> => {
    this.logs('buy start');
    // Add check if has orders and price goes donw, we need to dismiss order
    const order = await OrderService.order(this.marketInstrument.figi, 'Buy');
    if (!!order) {
      this.logs('Has orders');
      if ((order.price + this.cancelOrderGap) < price)
        await this.cancelOrder(order.orderId);

      return;
    }

    // find last sell and check value

    this.logs(this.price, price, this.price > price);

    if (!this.price || this.price > price) {
      this.price = price;

      return;
    }

    if (this.price + this.buyTrendStep * this.getMinPriceIncrement() < price) {
      this.logs(this.price);
      this.operationInfo.buyPrice = +(this.price + (this.buyTrendStep + 1) * this.getMinPriceIncrement()).toFixed(2);
      this.price = 0;
      await this.buyOrder(this.operationInfo.buyPrice);
    }
  }

  cancelOrder = async (orderId: string) => {
    await OrderService.cancelOrder(orderId);
  }

  buyOrder = async (price: number) => {
    this.logs('buyPrice', price);
    const placedLimitOrder: PlacedLimitOrder | undefined = await OrderService.createLimitOrder('Buy', this.marketInstrument, this.numberOfTickers, price);

    if (placedLimitOrder)
      this.operationInfo.buyOrderId = placedLimitOrder.orderId || '';
    else
      throw Error('Order not created');

    this.logs(`Ticket created order ${price}`);
    await DBService.buyInstrument(this.marketInstrument.figi, this.operationInfo, this.type);
  }

  sell = async ({price}: OrderResponse) => {
    this.logs('sell start');
    const order = await OrderService.order(this.marketInstrument.figi, 'Sell');
    if (order) {
      this.logs('Has orders');
      if ((order.price - this.cancelOrderGap) > price)
        await this.cancelOrder(order.orderId);
      return;
    }

    if (!this.isCurrentSellPriceMoreThanBuy(price))
      return;

    // find last buy and check value

    this.logs(this.price, price, this.price > price);

    if (!this.price || this.price < price) {
      this.price = price;
      if ((this.operationInfo.buyPrice + this.sellTrendStep * this.getMinPriceIncrement() + this.sellValueGap * this.getMinPriceIncrement()) < price)
        this.logs('Price more than 9 minPrice increment and we need to sell this faster. Sell trend');
      return;
    }

    if (this.price - this.sellTrendStep * this.getMinPriceIncrement() > price) {
      this.logs(this.price);
      this.operationInfo.sellPrice = +(this.price - (this.sellTrendStep + 1) * this.getMinPriceIncrement()).toFixed(2);
      this.price = 0;
      await this.sellOrder(this.operationInfo.sellPrice);
    }
  }

  sellOrder = async (price: number) => {
    this.logs('sellPrice', price);
    const placedLimitOrder: PlacedLimitOrder | undefined = await OrderService.createLimitOrder('Sell', this.marketInstrument, this.numberOfTickers, price);

    if (placedLimitOrder)
      this.operationInfo.sellOrderId = placedLimitOrder.orderId || '';
    else
      throw Error('Order not created');

    this.logs(`Ticket created order ${price}`);
    await DBService.sellInstrument(this.marketInstrument.figi, this.operationInfo, this.type);
  }

  getMinPriceIncrement = () => {
    return this.marketInstrument && this.marketInstrument.minPriceIncrement || 0;
  }

  logs = (...args: any[]) => console.log(this.marketInstrument.ticker + '    '.slice(0, 4 - this.marketInstrument.ticker.length), ' | ', this.type, ' | ', this.trend, ' | ', ...args);
}

export default ScalpService;
