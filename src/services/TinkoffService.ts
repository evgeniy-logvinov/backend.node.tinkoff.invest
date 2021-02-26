import OpenAPI, { CandleResolution, Depth, MarketInstrument, PlacedLimitOrder } from '@tinkoff/invest-openapi-js-sdk';
const dotenv = require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

// const ap iURL = 'https://api-invest.tinkoff.ru/openapi';
const sandboxApiURL = 'https://api-invest.tinkoff.ru/openapi/sandbox/';
const socketURL = 'wss://api-invest.tinkoff.ru/openapi/md/v1/md-openapi/ws';
const secretToken = process.env.TOKEN; // токен для боевого api
const sandboxToken = process.env.SANDBOX_TOKEN; // токен для сандбокса
console.log('sandboxToken', sandboxToken);
const api = new OpenAPI({ apiURL: sandboxApiURL, secretToken: sandboxToken as string, socketURL });

class TinkoffService {
    private apiURL = 'https://api-invest.tinkoff.ru/openapi';

    private socketURL = 'wss://api-invest.tinkoff.ru/openapi/md/v1/md-openapi/ws';

    private secretToken = 'xxx'; // токен для сандбокса

    public api: any;

    private maxValue = 0;
    // constructor() {
    //   this.api = new OpenAPI(
    //     {
    //       apiURL: this.apiURL,
    //       secretToken: this.secretToken,
    //       socketURL: this.socketURL,
    //     },
    //   );
    // }

    public sandboxClear = async () => {
      try {
        await api.sandboxClear();
      } catch (e) {
          console.log(e);
      }
    }

    public setCurrenciesBalance = async (currency: 'USD' | 'EUR', balance: number) => {
      try {
        await api.setCurrenciesBalance({currency, balance});
        console.log('set currencies result', currency, balance); // 1000$ на счет
      } catch (e) {
        console.log(e);
      }
  }

    public getPortfolioCurrencies = async () => {
      try {
        const res = await api.portfolioCurrencies();
        console.log('get portfolio currencies', res);
      } catch (e) {
        console.log(e);
      }
    }

    public getInstrumentPortfolio = async ({figi}: MarketInstrument) => {
      try {
        const res = await api.instrumentPortfolio({ figi })
        console.log('get instrument portfolio', res);
      } catch (e) {
        console.log(e);
      }
    }

    public createLimitOrder = async (operation: 'Buy' | 'Sell', {figi}: MarketInstrument, lots: number, price: number): Promise<PlacedLimitOrder | undefined> => {
      try {
        const res = await api.limitOrder({operation, figi, lots, price});
        console.log('limit order', res); // Покупаем AAPL
        console.log('commission', res.commission); // Покупаем AAPL
        return res;
      } catch (e) {
        console.log(e);
      }
    }

    public cancelOrder = async (orderId: string) => {
      try {
        const res = await api.cancelOrder({orderId});
        console.log('cancel order', res); // Покупаем AAPL
      } catch (e) {
        console.log(e);
      }
    }

    public getOrderbook = async (marketInstrument: MarketInstrument) => {
      try {
        const orderbook = await api.orderbookGet(marketInstrument); // получаем стакан по AAPL
        console.log('orderbook', orderbook); // получаем стакан по AAPL
      } catch (e) {
        console.log(e);
      }
    }

    public getCandles = async ({figi}: MarketInstrument, from: string = '2019-08-19T18:38:33.131642+03:00', to: string = '2019-08-19T18:48:33.131642+03:00', interval: CandleResolution = '1min') => {
      try {
        const res = await api.candlesGet({from, to, figi, interval}) // Получаем свечи за конкретный промежуток времени.
        console.log('Candels', res);
      } catch (e) {
        console.log(e);
      }
    }

    public getOrderBookByDepth = async ({figi}: MarketInstrument, depth: Depth = 10): Promise<() => void> => {
      return api.orderbook({ figi, depth }, (x) => {
        console.log('orderbook by depth', x.bids); // Стакан
      });
    }

    // public getOrderBookByDepth = async ({figi}: MarketInstrument, depth: Depth = 10) =>{
    //   api.orderbook({ figi, depth }, (x) => {
    //     console.log('orderbook by depth', x.bids); // Стакан
    //   });
    // }

    public getCandle = async (marketInstrument: MarketInstrument) => {
      api.candle(marketInstrument, (x) => {
        const candleValue = x.h;
        console.log('candle', candleValue);

        console.log('Investor-------------->');
        const comissionInvestor = Math.round(candleValue * 0.3) / 100;
        const finalValueInvestor = (candleValue + comissionInvestor).toFixed(2);
        console.log('comission Investor', comissionInvestor);
        console.log('Sum Investor', finalValueInvestor);
        if (Number(finalValueInvestor) > this.maxValue) {
          this.maxValue = Number(finalValueInvestor);
          console.log('------------------------------>New max value', this.maxValue);
        }
        console.log('Trader---------------->');
        const comissionTrader = Math.round(candleValue * 0.05) / 100;
        const finalValueTrader = (candleValue + comissionTrader).toFixed(2);
        console.log('comission Trader', comissionTrader);
        console.log('Sum Trader', finalValueTrader);
        console.log('------------------------------>Max value', this.maxValue);
      });
    }

    public searchOneByTicker = async (ticker: string): Promise<MarketInstrument | undefined> => {
      try {
        const marketInstrument = await api.searchOne({ ticker }) as MarketInstrument;
        // const marketInstrument = await api.searchOne({ ticker: 'AAPL' }) as MarketInstrument;
        return marketInstrument;
      } catch (e) {
        console.log(e);
      }
    //   console.log(await api.setCurrenciesBalance({ currency: 'USD', balance: 1000 })); // 1000$ на счет
    //   console.log(await api.portfolioCurrencies());
    //   console.log(await api.instrumentPortfolio({ figi })); // В портфеле ничего нет
    //   console.log(await api.limitOrder({
    //     operation: 'Buy', figi, lots: 1, price: 100,
    //   })); // Покупаем AAPL
    //   console.log(await api.instrumentPortfolio({ figi })); // Сделка прошла моментально
    //   console.log(await api.orderbookGet({ figi })); // получаем стакан по AAPL

    //   console.log(
    //     await api.candlesGet({
    //       from: '2019-08-19T18:38:33.131642+03:00',
    //       to: '2019-08-19T18:48:33.131642+03:00',
    //       figi,
    //       interval: '1min',
    //     }), // Получаем свечи за конкретный промежуток времени.
    //   );

    //   api.orderbook({ figi, depth: 10 }, (x) => {
    //     console.log(x.bids);
    //   });
    //   api.candle({ figi }, (x) => {
    //     console.log(x.h);
    //   });
    }
    // public testbuy = async () => {
    //   console.log('aaa');
    //   const data = await this.api.searchOne({ ticker: 'AAPL' });
    //   if (data?.figi) {
    //     const { figi } = data;
    //     const { commission, orderId } = await this.api.limitOrder({
    //       operation: 'Buy',
    //       figi,
    //       lots: 1,
    //       price: 100,
    //     }); // Покупаем AAPL
    //     console.log(commission); // Комиссия за сделку
    //     await this.api.cancelOrder({ orderId }); // Отменяем заявку
    //   }
    // }
}

export default new TinkoffService();
