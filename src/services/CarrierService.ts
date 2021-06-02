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
import ScalpService from './ScalpService';
import ScalpServiceTinkoffOnly from './ScalpServiceTinkoffOnly';
import TinkoffService from './TinkoffService';

class CarrierService {

  private testEnv = false;

  public fillPortfolio = async () => {
    const portfolioService = new PortfolioService();
    await portfolioService.sandboxClear();
    if (this.testEnv)
      portfolioService.setCurrenciesBalance('USD', 4000);
  }

  public getPortfolio = async () => {
    const portfolioService = new PortfolioService();
    await portfolioService.getPortfolio();
  }

  public Apple = async () => {
    const ticker = 'AAPL';
    this.startProcessTinkoffOnly(ticker);
  }

  public Baidu = async () => {
    const ticker = 'BIDU';
    this.startProcessTinkoffOnly(ticker);
  }

  public EnergyTransfer = async () => {
    const ticker = 'ET';
    this.startProcessTinkoffOnly(ticker);
  }

  public AmericanAirlines = async () => {
    const ticker = 'AAL';
    this.startProcessTinkoffOnly(ticker);
  }

  public BakerHughes = async () => {
    const ticker = 'BKR';
    this.startProcessTinkoffOnly(ticker);
  }

  public RoyalDutchShell = async () => {
    const ticker = 'RDS.A';
    this.startProcessTinkoffOnly(ticker, 3);
  }

  public Nike = async () => {
    const ticker = 'NKE';
    this.startProcessTinkoffOnly(ticker, 3);
  }

  public CorEnergyInfrastructureTrust = async () => {
    const ticker = 'CORR';
    this.startProcessTinkoffOnly(ticker, 4);
  }

  public Fxim = async () => {
    const ticker = 'FXIM';
    this.startProcessTinkoffOnly(ticker, 2);
  }

  public Hess = async () => {
    const ticker = 'HES';
    this.startProcessTinkoffOnly(ticker);
  }

  private async startProcess(ticker: string) {
    // this.startProcessInvestor(ticker);
    // this.startProcessTrader(ticker);
    // this.startProcessTraderCandle(ticker);
    this.startProcessScalp(ticker);
  }

  private async startProcessTinkoffOnly(ticker: string, balance: number = 1) {
    // this.startProcessInvestor(ticker);
    // this.startProcessTrader(ticker);
    // this.startProcessTraderCandle(ticker);
    this.startProcessScalpTinkoffOnly(ticker, balance);
  }

  startProcessScalp = async (ticker: string) => {
    const marketInstrument = await TinkoffService.getInstrument(ticker);
    const scalpService = new ScalpService(marketInstrument, 1, 'traider');
    scalpService.start();
  }

  startProcessScalpTinkoffOnly = async (ticker: string, balance: number) => {
    const marketInstrument = await TinkoffService.getInstrument(ticker);
    const scalpService = new ScalpServiceTinkoffOnly(marketInstrument, balance, 'traider');
    scalpService.start();
  }

  private async startProcessTraderCandle(ticker: string) {
    // const tinkoff = new TinkoffServiceCandle(ticker, 'traider', 1);
    // await tinkoff.fillInstrument();
    // await tinkoff.fillOngoingSell();
    // await tinkoff.start();
  }

  private startProcessTrader = async (ticker: string) => {
    // const tinkoffService = new TinkoffService(ticker, 'traider');
    // await tinkoffService.fillInstrument();
    // await tinkoffService.fillOngoingSell();
    // await tinkoffService.start();
  }

  private startProcessInvestor = async (ticker: string) => {
    // const tinkoffService = new TinkoffService(ticker);
    // await tinkoffService.fillInstrument();
    // await tinkoffService.fillOngoingSell();
    // await tinkoffService.start();
  }
}
// 1) Смотрим на текущий курс акции и смотрим куда она меняется.
// 2.1) Если она идет верх то мы ее покупаем
// 2.2) Если она идет вниз то мы ее не покупаем и смотрим на цену пока она не начнет идти вверх (Записываю значение в этой точке)
// 3) После покупки опять смотрим за ее движением.
// 3.1) Если она идет вверх то ждем пока не остановится рост и она не пойдет вниз на 2 пункта
// 3.1.1) Если она идет вниз и разница между ценой покупки и текущей ценой + комиссия больше то мы ее продаем
// 3.1) Если она идет вниз и разница между ценой покупки и текущей ценой + комиссия меньше то мы ждем пока она не увеличится
export default CarrierService;
