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
import { CandleResolution, CandleStreaming, MarketInstrument, OperationType, Order, OrderbookStreaming, PlacedLimitOrder } from '@tinkoff/invest-openapi-js-sdk';
import api from './ApiService';
import HelperService from './HelperService';

class OrderService {

    public static createLimitOrder = async (operation: 'Buy' | 'Sell', {figi}: MarketInstrument, lots: number, price: number): Promise<PlacedLimitOrder | undefined> => {
      return await api.limitOrder({operation, figi, lots, price});
    }

    public static cancelOrder = async (orderId: string) => {
      await api.cancelOrder({orderId});
    }

    public static getOrderbook = async (marketInstrument: MarketInstrument) => {
      try {
        const orderbook = await api.orderbookGet(marketInstrument); // получаем стакан по AAPL
        console.log('orderbook', orderbook); // получаем стакан по AAPL
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }

    public static getCandles = async ({figi}: MarketInstrument, from: string = '2019-08-19T18:38:33.131642+03:00', to: string = '2019-08-19T18:48:33.131642+03:00', interval: CandleResolution = '1min') => {
      try {
        const res = await api.candlesGet({from, to, figi, interval}); // Получаем свечи за конкретный промежуток времени.
        console.log('Candels', res);
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }

    public static hasPlacedOrder = async (orderId: string): Promise<boolean | undefined> => {
      try {
        const orders: Order[] = await api.orders();
        const currentOrder = orders.find(el => el.orderId === orderId);
        return !!currentOrder;
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }

    public static order = async (figi: string, operation: OperationType): Promise<Order | undefined> => {
      try {
        const orders: Order[] = await api.orders();
        const currentOrder = orders.find(el => el.operation === operation && el.figi === figi);
        return currentOrder;
      } catch (err) {
        HelperService.errorHandler(err);
      }
    }

    public static bigNumberOfOrdersBids(x: OrderbookStreaming) {
      x.bids.forEach(bid => {
        if (bid[1] > 2000)
          console.log('bid', bid[0], bid[1]);
      });
    }

    public static bigNumberOfOrdersAsks(x: OrderbookStreaming) {
      x.asks.forEach(ask => {
        if (ask[1] > 2000)
          console.log('ask', ask[0], ask[1]);
      });
    }

    public static drawCandleUp(x: CandleStreaming) {
      const candleMaxValue = x.h;
      const candleMinValue = x.l;
      const candleOpenValue = x.o;
      const candleCloseValue = x.c;
      console.log(' ^ ');
      console.log(' | ');
      if (!!process.env.debug) {
        console.log('  -                candleMaxValue', candleMaxValue);
        console.log('  -');
        console.log('-----              candleCloseValue', candleCloseValue);
        console.log('-----');
        console.log('-----');
        console.log('-----');
        console.log('-----');
        console.log('-----              candleOpenValue', candleOpenValue);
        console.log('  -');
        console.log('  -                candleMinValue', candleMinValue);
      }
    }

    public static drawCandleDown(x: CandleStreaming) {
      console.log(' | ');
      console.log(' V ');
      if (!!process.env.debug) {
        const candleMaxValue = x.h;
        const candleMinValue = x.l;
        const candleOpenValue = x.o;
        const candleCloseValue = x.c;
        console.log('  -                candleMaxValue', candleMaxValue);
        console.log('  -');
        console.log('-   -              candleCloseValue', candleCloseValue);
        console.log('-   -');
        console.log('-   -');
        console.log('-   -');
        console.log('-   -');
        console.log('-    -              candleOpenValue', candleOpenValue);
        console.log('  -');
        console.log('  -                candleMinValue', candleMinValue);
      }
    }

}

export default OrderService;
