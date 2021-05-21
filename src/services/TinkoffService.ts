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
import { CandleResolution, Candles, Depth, MarketInstrument, Orderbook, PortfolioPosition } from '@tinkoff/invest-openapi-js-sdk';
import DBService from './DBService';
import OrderService from './OrderService';
import moment from 'moment';

class TinkoffService {
    private orderbookInProgress: Function = () => {};

    static getTickerPortfolio = async (figi: string): Promise<PortfolioPosition | null> => {
      return await api.instrumentPortfolio({figi});
    }

    static getOrderbook = async (figi: string, depth: Depth = 10): Promise<Orderbook> => {
      return await api.orderbookGet({ figi, depth });
    }

    static getCandle = async (figi: string, interval: CandleResolution = '1min'): Promise<Candles> => {
      return await api.candlesGet({ figi, interval, from: moment().format(), to: moment().format() });
    }

    static candle = async (marketInstrument: MarketInstrument) => {
      // https://tinkoffcreditsystems.github.io/invest-openapi/marketdata/
      api.candle({figi: marketInstrument.figi, interval: '5min'}, x => {
        // const candleMaxValue = x.h;
        // const candleTradingVolume = x.v;

        if (x.c > x.o)
          OrderService.drawCandleUp(x);
        else
          OrderService.drawCandleDown(x);

        // if (!!process.env.debug)
        // console.log('candleTradingVolume', candleTradingVolume);

        // const finalVolume = this.getInvestorVolumes(candleMaxValue);
        // if (Number(finalVolume) > this.maxValue) {
        //   this.maxValue = Number(finalVolume);
        //   console.log('------------------------------>New max value', this.maxValue);
        // }
        // InvestorService.getTraderVolumes(candleMaxValue);
        // console.log('------------------------------>Max value', this.maxValue);
      });
    }

    public searchOneByTicker = async (ticker: string): Promise<MarketInstrument> => {
      return await api.searchOne({ ticker }) as MarketInstrument;
    }

    static getInstrument = async (ticker: string): Promise<MarketInstrument> => {
      const marketInstrument = await api.searchOne({ ticker }) as MarketInstrument;
      if (!marketInstrument)
        throw Error(`Can't find instrument ${ticker}`);

      await DBService.save(marketInstrument);
      return marketInstrument;
    }
}

export default TinkoffService;
