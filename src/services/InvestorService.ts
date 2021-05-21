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
class InvestorService {

    public static getInvestorComission = (volume: number): number => {
      return Math.round(volume * 0.3) / 100;
    }

    public static getTax = (sellPrice: number, sellComm: number, buyPrice: number, buyComm: number): number => {
      return +(Math.round((sellPrice - sellComm - buyPrice - buyComm) / 100 * 13)).toFixed(2);
    }

    public static getTraderComission = (value: number) => {
      return Math.round(value * 0.05) / 100;
    }
}

export default InvestorService;
