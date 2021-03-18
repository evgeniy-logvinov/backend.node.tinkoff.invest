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
import PortfolioService from './PortfolioService';
import TinkoffService from './TinkoffService';

class CarrierService {

  private testEnv = true;

  public Apple = async () => {
    const ticker = 'AAPL';
    const tinkoffService = new TinkoffService({ticker});
    const portfolioService = new PortfolioService();
    await portfolioService.sandboxClear();
    if (this.testEnv)
      portfolioService.setCurrenciesBalance('USD', 400);

    await tinkoffService.fillInstrument();
    await tinkoffService.startOrderbookCheckByDepth();
  }

  // public testSandox = async () => {
  // await TinkoffService.sandboxClear();
  // const ticker = 'AAPL';
  // const marketInstrument: MarketInstrument | undefined = await TinkoffService.searchOneByTicker(ticker);

  // if (marketInstrument) {
  //   const count = await Instrument().where('figi', marketInstrument.figi).count('figi');
  //   console.log('marketInstrument', marketInstrument);
  //   if (count[0].count === '0') {
  //     console.log(`Ticker ${ticker} exists`);
  //     try {
  //       await Instrument().insert({...marketInstrument});
  //     } catch (err) {
  //       console.log(err);
  //     }
  //   }

  //   await this.buyInstrument({figi: marketInstrument.figi, buyVolume: 10});
  //   await this.sellInstrument({figi: marketInstrument.figi, sellVolume: 34});
  // const instrumentList: MarketInstrumentList | undefined = await TinkoffService.stocks();
  // console.log('--->>0', marketInstrument.name, marketInstrument.figi);
  // await TinkoffService.getInstrumentPortfolio(marketInstrument);
  // await TinkoffService.setCurrenciesBalance('USD', 400);
  // await TinkoffService.getPortfolioCurrencies();
  // await TinkoffService.createLimitOrder('Buy', marketInstrument, 1, 100);
  // console.log('--->>1');
  // await TinkoffService.getInstrumentPortfolio(marketInstrument);
  // const order: PlacedLimitOrder | undefined = await TinkoffService.createLimitOrder('Buy', marketInstrument, 1, 100);
  // console.log('--->>2', order);
  // // await TinkoffService.getInstrumentPortfolio(marketInstrument);
  // // await TinkoffService.getOrderbook(marketInstrument);
  // await TinkoffService.getCandles(marketInstrument);
  // if (order)
  //   await TinkoffService.cancelOrder(order.orderId);

  // const unsubOrderbook = await TinkoffService.getOrderBookByDepth(marketInstrument, 10);
  // // if (unsubOrderbook) {
  // //     unsubOrderbook();
  // // }
  // const unsubCandle = await TinkoffService.getCandle(marketInstrument);
  // console.log('unsubCandle', unsubCandle);
  // }
  // }
}
// 1) Смотрим на текущий курс акции и смотрим куда она меняется.
// 2.1) Если она идет верх то мы ее покупаем
// 2.2) Если она идет вниз то мы ее не покупаем и смотрим на цену пока она не начнет идти вверх (Записываю значение в этой точке)
// 3) После покупки опять смотрим за ее движением.
// 3.1) Если она идет вверх то ждем пока не остановится рост и она не пойдет вниз на 2 пункта
// 3.1.1) Если она идет вниз и разница между ценой покупки и текущей ценой + комиссия больше то мы ее продаем
// 3.1) Если она идет вниз и разница между ценой покупки и текущей ценой + комиссия меньше то мы ждем пока она не увеличится
export default CarrierService;
