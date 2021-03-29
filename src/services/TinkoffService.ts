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
import api from './ApiService';
import { Depth, MarketInstrument, Orderbook, Portfolio } from '@tinkoff/invest-openapi-js-sdk';
import DBService from './DBService';
import TinkoffOrderService from './TinkoffOrderService';
import HelperService from './HelperService';
import TinkoffBuyService from './TinkoffBuyService';
import TinkoffSellService from './TinkoffSellService';

export interface Buy {
  price: number;
  // comission: number;
  limitOrderId: string;
}

export interface Sell {
  price: number;
  limitOrderId: string;
}
export interface OperationInfo {
  buy: Buy;
  sell: Sell
  marketInstrument?: MarketInstrument;
}
class TinkoffService {
    private maxValue = 0;

    private numberOfInstruments = 1;

    private orderbookInProgress: Function = () => {};

    private ticker: string;

    private timerId: NodeJS.Timeout | undefined = undefined;

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

    private sellService: TinkoffSellService | null = null;
    private buyService: TinkoffBuyService | null = null;

    constructor({ticker}: {ticker: string}) {
      this.ticker = ticker;
    }

    private checkTicker = async () => {
      if (!this.buyService || !this.sellService)
        throw new Error('Services is empty');
      // Проверяем есть ли в потрфеле акции текущего продукта или есть ли открытые заявки по текущему продукту.
      // Если есть акции в портфеле то перейти к логике продажи
      // Если есть неисполненные заявки на продажу то ничего не делать и ждать исполнения
      // Если есть неисполненные заявки на покупку то ничего не делать и ждать исполнения
      // const portfolio = new PortfolioService();
      // console.log(await api.orderbookGet({ figi: this.operationInfo.marketInstrument.figi, depth: 10 })); // получаем стакан по AAPL
      console.log('Timeout start');
      const tickerPortfolio =  await api.instrumentPortfolio({ticker: this.ticker});
      const currentBalance = tickerPortfolio && tickerPortfolio.balance || 0;

      // console.log(await api.accounts());
      // console.log(await api.bonds());
      const portfolio: Portfolio = await api.portfolio();
      const USDPosition = portfolio.positions.find(el => el.ticker === 'USD000UTSTOM');
      if (USDPosition)
        console.log('USD Position balance', USDPosition.balance);

      if (currentBalance > this.numberOfInstruments) {
        throw new Error(`Some problems with balance. Number of Instruments more than expected currentBalance: ${currentBalance} numberOfInstruments ${this.numberOfInstruments}`);
      } else {
        console.log('Current ticker balance', currentBalance);
        if (this.operationInfo.marketInstrument) {
          const orderbook: Orderbook = await api.orderbookGet({ figi: this.operationInfo.marketInstrument.figi, depth: 10 });

          if (currentBalance === this.numberOfInstruments) {
            console.log('Sell logic');
            const operationInfo = await this.sellService.sellLogic(orderbook.asks[0].price);
            this.operationInfo = operationInfo;
          } else {
            console.log('Buy logic');
            const operationInfo = await this.buyService.buyLogic(orderbook.bids[0].price);
            this.operationInfo = operationInfo;
          }
        }
      }

      this.timerId = setTimeout(this.checkTicker, 2000);
    }

    public start = () => {
      this.buyService = new TinkoffBuyService(this.operationInfo);
      this.sellService = new TinkoffSellService(this.operationInfo);

      this.timerId = setTimeout(this.checkTicker, 1000);
    }

    public finish = () => {
      console.log('Timeout finish');
      if (this.timerId)
        clearTimeout(this.timerId);
    }

    public startOrderbookCheckByDepth = async (depth: Depth = 10): Promise<void> => {
      if (this.operationInfo.marketInstrument) {
        const tinkoffBuyService = new TinkoffBuyService(this.operationInfo);
        const tinkoffSellService = new TinkoffSellService(this.operationInfo);

        this.orderbookInProgress = api.orderbook({ figi: this.operationInfo.marketInstrument.figi, depth }, async x => {
          const tickerPortfolio =  await api.instrumentPortfolio({ticker: this.ticker});
          const currentBalance = tickerPortfolio && tickerPortfolio.balance || 0;

          if (currentBalance > this.numberOfInstruments) {
            throw new Error(`Some problems with balance. Number of Instruments more than expected currentBalance: ${currentBalance} numberOfInstruments ${this.numberOfInstruments}`);
          } else {
            console.log('Current ticker balance', currentBalance);
            if (this.operationInfo.marketInstrument) {
              if (currentBalance === this.numberOfInstruments) {
              // Логика продажи
                console.log('Sell logic');
                const operationInfo = await tinkoffSellService.sellLogic(x.asks[0][0]);
                this.operationInfo = operationInfo;
              } else {
              // Логика покупки
                console.log('Buy logic');
                const operationInfo = await tinkoffBuyService.buyLogic(x.bids[0][0]);
                this.operationInfo = operationInfo;
              }
            }
          }
        });
        console.log('Orderbook started');
      } else {
        throw new Error('Market instrument is null');
      }
    }

    public stopOrderbookCheckByDepth = async (): Promise<void> => {
      if (this.orderbookInProgress) {
        await this.orderbookInProgress();
        console.log('Orderbook stoped');
      } else {throw new Error('Orderbook not exists');}
    }

    public getCandle = async (marketInstrument: MarketInstrument) => {
      // https://tinkoffcreditsystems.github.io/invest-openapi/marketdata/
      api.candle({figi: marketInstrument.figi, interval: '5min'}, x => {
        const candleMaxValue = x.h;
        const candleTradingVolume = x.v;

        if (x.c > x.o)
          TinkoffOrderService.drawCandleUp(x);
        else
          TinkoffOrderService.drawCandleDown(x);

        if (!!process.env.debug)
          console.log('candleTradingVolume', candleTradingVolume);

        const finalVolume = this.getInvestorVolumes(candleMaxValue);
        if (Number(finalVolume) > this.maxValue) {
          this.maxValue = Number(finalVolume);
          console.log('------------------------------>New max value', this.maxValue);
        }
        this.getTraderVolumes(candleMaxValue);
        console.log('------------------------------>Max value', this.maxValue);
      });
    }

    public searchOneByTicker = async (ticker: string): Promise<MarketInstrument | undefined> => {
      try {
        return await api.searchOne({ ticker }) as MarketInstrument;
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }

    public getInstrument() {
      return this.operationInfo.marketInstrument;
    }

    public fillInstrument = async (): Promise<void> => {
      try {
        this.operationInfo.marketInstrument = await api.searchOne({ ticker: this.ticker }) as MarketInstrument;

        if (!this.operationInfo.marketInstrument)
          throw Error(`Can't find instrument ${this.ticker}`);

        await DBService.save(this.operationInfo.marketInstrument);
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }

    public fillOngoingSell = async (): Promise<void> => {
      try {
        const order: any = await DBService.getCurrentOrder(this.operationInfo);
        if (order) {
          this.operationInfo.buy.limitOrderId = order.buyOrderId;
          this.operationInfo.buy.price = order.buyPrice;
        }
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }

    private getInvestorVolumes = (value: number) => {
      const comissionInvestor = this.getInvestorComission(value);
      const finalValueInvestor = (value + comissionInvestor).toFixed(2);
      if (!!process.env.debug) {
        console.log('Investor-------------->');
        console.log('comission Investor', comissionInvestor);
        console.log('Sum Investor', finalValueInvestor);
      }
      return finalValueInvestor;
    }

    private getInvestorComission = (volume: number) => {
      return Math.round(volume * 0.3) / 100;
    }

    private getTraderVolumes = (value: number) => {
      const comissionTrader = Math.round(value * 0.05) / 100;
      const finalValueTrader = (value + comissionTrader).toFixed(2);
      if (!!process.env.debug) {
        console.log('Trader---------------->');
        console.log('comission Trader', comissionTrader);
        console.log('Sum Trader', finalValueTrader);
      }
    }
}

export default TinkoffService;
