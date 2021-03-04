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
import TinkoffService from './TinkoffService';
import { MarketInstrument, PlacedLimitOrder } from '@tinkoff/invest-openapi-js-sdk';

class CarrierService {

    public testSandox = async () => {
      await TinkoffService.sandboxClear();
      const marketInstrument: MarketInstrument | undefined = await TinkoffService.searchOneByTicker('ET');
      if (marketInstrument) {
        console.log('--->>0', marketInstrument.name, marketInstrument.figi);
        await TinkoffService.getInstrumentPortfolio(marketInstrument);
        await TinkoffService.setCurrenciesBalance('USD', 400);
        await TinkoffService.getPortfolioCurrencies();
        await TinkoffService.createLimitOrder('Buy', marketInstrument, 1, 100);
        console.log('--->>1');
        await TinkoffService.getInstrumentPortfolio(marketInstrument);
        const order: PlacedLimitOrder | undefined = await TinkoffService.createLimitOrder('Buy', marketInstrument, 1, 100);
        console.log('--->>2', order);
        // await TinkoffService.getInstrumentPortfolio(marketInstrument);
        // await TinkoffService.getOrderbook(marketInstrument);
        await TinkoffService.getCandles(marketInstrument);
        if (order)
          await TinkoffService.cancelOrder(order.orderId);

        // const unsubOrderbook = await TinkoffService.getOrderBookByDepth(marketInstrument, 6);
        // if (unsubOrderbook) {
        //     unsubOrderbook();
        // }
        const unsubCandle = await TinkoffService.getCandle(marketInstrument);
        console.log('unsubCandle', unsubCandle);
      }
    }
}

export default CarrierService;
