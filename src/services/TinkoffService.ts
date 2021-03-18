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

class TinkoffService {
    private maxValue = 0;

    private orderbookInProgress: Function = () => {};

    private operationType: OperationType = 'Buy';

    private ticker: string;

    private marketInstrument: MarketInstrument | null = null;

    private buyOperation = {
      volume: 0,
      placedLimitOrderId: '',
      fixedVolume: 0,
    }

    constructor({ticker}: {ticker: string}) {
      this.ticker = ticker;
    }

    public startOrderbookCheckByDepth = async (depth: Depth = 10): Promise<void> => {
      if (this.marketInstrument) {
        this.orderbookInProgress = api.orderbook({ figi: this.marketInstrument.figi, depth }, async x => {
          if (this.operationType === 'Buy') {
            if (this.marketInstrument) {
              const tinkoffBuyService = new TinkoffBuyService(this.buyOperation, this.marketInstrument);
              const {buyOperation, operationType} = await tinkoffBuyService.buyLogic(x.bids[0][0]);
              this.operationType = operationType;
              this.buyOperation = buyOperation;
            }
          } else {
            if (this.marketInstrument) {
              const tinkoffSellService = new TinkoffSellService(this.buyOperation, this.marketInstrument);
              await tinkoffSellService.sellLogic(x.asks[0][0]);
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
        const marketInstrument = await api.searchOne({ ticker }) as MarketInstrument;
        // const marketInstrument = await api.searchOne({ ticker: 'AAPL' }) as MarketInstrument;
        return marketInstrument;
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }

    public getInstrument() {
      return this.marketInstrument;
    }

    public fillInstrument = async (): Promise<void> => {
      try {
        const marketInstrument = await api.searchOne({ ticker: this.ticker }) as MarketInstrument;
        this.marketInstrument = marketInstrument;

        if (!marketInstrument)
          throw Error(`Can't find instrument ${this.ticker}`);

        await DBService.save(marketInstrument);
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
