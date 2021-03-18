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
import { Depth, MarketInstrument, OperationType } from '@tinkoff/invest-openapi-js-sdk';
import DBService from './DBService';
import TinkoffOrderService from './TinkoffOrderService';
import HelperService from './HelperService';
import TinkoffBuyService from './TinkoffBuyService';
import TinkoffSellService from './TinkoffSellService';

export interface Buy {
  price: number;
  comission: number;
  limitOrderId: string;
}

export interface Sell {
  price: number;
  comission: number;
  limitOrderId: string;
}
export interface OperationInfo {
  buy: Buy;
  sell: Sell
  fixedVolume: number;
  operationType: OperationType;
  marketInstrument?: MarketInstrument;
}
class TinkoffService {
    private maxValue = 0;

    private orderbookInProgress: Function = () => {};

    private ticker: string;

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
      marketInstrument: undefined,
    }

    constructor({ticker}: {ticker: string}) {
      this.ticker = ticker;
    }

    public startOrderbookCheckByDepth = async (depth: Depth = 10): Promise<void> => {
      if (this.operationInfo.marketInstrument) {
        this.orderbookInProgress = api.orderbook({ figi: this.operationInfo.marketInstrument.figi, depth }, async x => {
          if (this.operationInfo.operationType === 'Buy') {
            if (this.operationInfo.marketInstrument) {
              const tinkoffBuyService = new TinkoffBuyService(this.operationInfo);
              const operationInfo = await tinkoffBuyService.buyLogic(x.bids[0][0]);
              this.operationInfo = operationInfo;
            }
          } else {
            if (this.operationInfo.marketInstrument) {
              const tinkoffSellService = new TinkoffSellService(this.operationInfo);
              const operationInfo = await tinkoffSellService.sellLogic(x.asks[0][0]);
              this.operationInfo = operationInfo;
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
