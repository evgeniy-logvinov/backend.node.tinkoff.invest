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
import HelperService from './HelperService';
import InvestorService from './InvestorService';
import OrderService from './OrderService';
import TinkoffService from './TinkoffService';

export type BillType = 'investor' | 'traider';

class ScalpServiceTinkoffOnly {
  private marketInstrument: MarketInstrument;
  private type: BillType;
  private trend: 'Buy' | 'Sell' = 'Buy';
  private numberOfTickers: number = 1;
  private buyTrendStep: number = 4;
  private buyPrice: number = 0;
  private sellPrice: number = 4;
  private sellTrendStep: number = 4;
  private sellValueGap: number = 7;
  private buyValueGap: number = 7;
  private price: number = 0;
  private timerId: NodeJS.Timeout | undefined = undefined;

  constructor(marketInstrument: MarketInstrument, numberOfTickers: number, type: BillType = 'investor') {
    this.marketInstrument = marketInstrument;
    this.type = type;
    this.numberOfTickers = numberOfTickers;
  }

  startStrategy = async () => {
    try {
      const figi: string = this.marketInstrument.figi;
      const orders = await TinkoffService.getOrdersByFigi(figi);
      this.logs('orders', orders);
      if (orders.length > 1)
        throw new Error('More than one order. Please check whats goin on');

      const orderbook = await TinkoffService.getOrderbook(this.marketInstrument.figi, 1);

      if (!orders.length) {
        const portfolio = await TinkoffService.getTickerPortfolio(figi);
        this.logs('portfolio', portfolio);
        this.logs('portfolio', portfolio?.averagePositionPrice, portfolio?.averagePositionPriceNoNkd);

        if (portfolio && portfolio.balance > this.numberOfTickers) {
          throw Error(`Some problems with balance. Number of Instruments more than expected currentBalance: ${portfolio.balance} numberOfTickers ${this.numberOfTickers}`);
        } else if (!portfolio || portfolio.balance < this.numberOfTickers) {
          this.trend = 'Buy';
          if (orderbook.bids[0])
            await this.buy(orderbook.bids[0]);
        } else {
          this.logs('averagePositionPrice', portfolio?.averagePositionPrice?.value, this.buyPrice);
          if (!this.buyPrice)
            this.buyPrice = portfolio?.averagePositionPrice?.value || 0;

          const orderbook = await TinkoffService.getOrderbook(this.marketInstrument.figi, 1);
          this.logs('orderbook', orderbook);
          this.trend = 'Sell';
          if (orderbook.asks[0])
            await this.sell(orderbook.asks[0]);

        }
      } else {
        const currentOrder = orders[0];
        this.logs(currentOrder);
        if (currentOrder.operation === 'Buy') {
          if (currentOrder.price > orderbook.bids[0].price) {
            await OrderService.cancelOrder(currentOrder.orderId);
            this.logs(`Order canceled: O: ${currentOrder.operation} Price from order ${currentOrder.price} Orderbook: ${orderbook.bids[0].price}`);
          } else {
            this.logs('Waiting when order will be approved');
          }
        } else {
          if (currentOrder.price < orderbook.asks[0].price) {
            await OrderService.cancelOrder(currentOrder.orderId);
            this.logs(`Order canceled: O: ${currentOrder.operation} Price from order ${currentOrder.price} Orderbook: ${orderbook.asks[0].price}`);
          } else {
            this.logs('Waiting when order will be approved');
          }
        }
      }
    } catch (err) {
      HelperService.errorHandler(err);
    } finally {
      this.timerId = setTimeout(this.startStrategy, 2000);
    }
  };

  start = async () => {
    this.logs(`Start`);
    this.timerId = setTimeout(this.startStrategy, 2000);
  }

  finish = () => {
    this.logs(`Finish`);
    if (this.timerId)
      clearTimeout(this.timerId);
  }

  getSellGap(): number {
    return +((this.getMinPriceIncrement() * this.sellValueGap).toFixed(2));
  }

  getBuyGap(): number {
    return +((this.getMinPriceIncrement() * this.buyValueGap).toFixed(2));
  }

  getPrice = (price: number): number => {
    return +(price - this.getMinPriceIncrement()).toFixed(2);
  }

  buy = async ({price}: OrderResponse): Promise<void> => {
    this.logs('buy start');
    this.logs(this.price, price, this.price > price);

    if (!this.price || this.price > price) {
      this.price = price;

      return;
    }

    if (this.price + this.buyTrendStep * this.getMinPriceIncrement() < price) {
      this.logs('price', price);
      this.buyPrice = +(price + this.getBuyGap()).toFixed(2);
      this.price = 0;
      await this.buyOrder(this.buyPrice);
    }
  }

  buyOrder = async (price: number) => {
    this.logs('buyPrice', price);
    const placedLimitOrder: PlacedLimitOrder | undefined = await OrderService.createLimitOrder('Buy', this.marketInstrument, this.numberOfTickers, price);

    if (!placedLimitOrder)
      throw Error('Order not created');

    this.logs(`Ticket created order P: ${price} ID: ${placedLimitOrder.orderId} Fee: ${placedLimitOrder.commission}`);
  }

  sell = async ({price}: OrderResponse) => {
    this.logs('sell start');

    const currentSellPrice = price - this.getSellGap();

    const buyPrice = this.buyPrice;
    const buyComission = this.type === 'investor' ? InvestorService.getInvestorComission(buyPrice) : InvestorService.getTraderComission(buyPrice);
    const sellComission = this.type === 'investor' ? InvestorService.getInvestorComission(currentSellPrice) : InvestorService.getTraderComission(currentSellPrice);

    this.logs(this.price, currentSellPrice, this.price > currentSellPrice);

    const sellSumm = +((+currentSellPrice - +sellComission).toFixed(2));
    const buySumm = +((+buyPrice + +buyComission).toFixed(2));

    const tax = InvestorService.getTax(currentSellPrice, sellComission, buyPrice, buyComission);

    this.logs(`sellSumm: ${sellSumm} | buySumm: ${buySumm} | tax: ${tax}`);
    const canSell = sellSumm > (buySumm + tax);

    if (!canSell) {
      this.logs(`Not usefull order. Expected more: ${buySumm + tax}`);

      return;
    }

    if (!this.price || this.price < currentSellPrice) {
      this.price = currentSellPrice;

      return;
    }

    if (this.price - this.sellTrendStep * this.getMinPriceIncrement() > currentSellPrice) {
      this.logs(currentSellPrice);
      this.sellPrice = currentSellPrice;
      this.price = 0;
      await this.sellOrder(this.sellPrice);
    }
  }

  sellOrder = async (price: number) => {
    this.logs('sellPrice', price);
    const placedLimitOrder: PlacedLimitOrder | undefined = await OrderService.createLimitOrder('Sell', this.marketInstrument, this.numberOfTickers, price);

    if (!placedLimitOrder)
      throw Error('Order not created');

    this.logs(`Ticket created order P: ${price} ID: ${placedLimitOrder.orderId} Fee: ${placedLimitOrder.commission}`);
  }

  getMinPriceIncrement = () => {
    return this.marketInstrument && this.marketInstrument.minPriceIncrement || 0;
  }

  logs = (...args: any[]) => console.log(this.marketInstrument.ticker + '    '.slice(0, 4 - this.marketInstrument.ticker.length), ' | ', this.type, ' | ', this.trend, ' | ', ...args);
}

export default ScalpServiceTinkoffOnly;
