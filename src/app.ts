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
import express from 'express';
import CarrierService from './services/CarrierService';
import HelperService from './services/HelperService';

const app = express();

console.log('sandboxToken', process.env.SANDBOX_TOKEN);
console.log('token', process.env.TOKEN);
if (process.env.SANDBOX_TOKEN || process.env.TOKEN) {
  try {
    const carrier = new CarrierService();
    carrier.fillPortfolio();
    carrier.getPortfolio();
    // carrier.Apple();
    // carrier.Baidu();
    carrier.EnergyTransfer();
    carrier.AmericanAirlines();
    carrier.BakerHughes();
    carrier.RoyalDutchShell();
    carrier.Nike();
    carrier.CorEnergyInfrastructureTrust();
    carrier.Fxim();
    // carrier.Hess();
  } catch (err) {
    HelperService.errorHandler(err);
  }
} else {
  throw Error('Please fill sandbox token');
}


export default app;
