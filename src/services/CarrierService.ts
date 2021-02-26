import TinkoffService from './TinkoffService';
import { MarketInstrument, PlacedLimitOrder } from '@tinkoff/invest-openapi-js-sdk';

class CarrierService {

    public testSandox = async () => {
        await TinkoffService.sandboxClear();
        const marketInstrument: MarketInstrument | undefined = await TinkoffService.searchOneByTicker('ET');
        if (marketInstrument) {
            console.log('--->>0', marketInstrument.name, marketInstrument.figi)
            await TinkoffService.getInstrumentPortfolio(marketInstrument);
            await TinkoffService.setCurrenciesBalance('USD', 400);
            await TinkoffService.getPortfolioCurrencies(); 
            await TinkoffService.createLimitOrder('Buy', marketInstrument, 1, 100); 
            console.log('--->>1') 
            await TinkoffService.getInstrumentPortfolio(marketInstrument);
            const order: PlacedLimitOrder | undefined = await TinkoffService.createLimitOrder('Buy', marketInstrument, 1, 100);
            console.log('--->>2', order);
            // await TinkoffService.getInstrumentPortfolio(marketInstrument);
            // await TinkoffService.getOrderbook(marketInstrument);
            await TinkoffService.getCandles(marketInstrument);
            if (order) {
                await TinkoffService.cancelOrder(order.orderId);
            }
            // const unsubOrderbook = await TinkoffService.getOrderBookByDepth(marketInstrument, 6);
            // if (unsubOrderbook) {
            //     unsubOrderbook();
            // }
            const unsubCandle = await TinkoffService.getCandle(marketInstrument);    
        }
    }
}

export default CarrierService;