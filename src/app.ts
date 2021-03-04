import express from 'express';
import CarrierService from './services/CarrierService';

const app = express();
const PORT = 6699;

const carrier = new CarrierService();
carrier.testSandox();

export default app;
