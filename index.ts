import express from 'express';
import CarrierService from './src/services/CarrierService';

const app = express();
const PORT = 6699;

const carrier = new CarrierService();
carrier.testSandox();

// app.get('/', (req, res) => res.send('Express + TypeScript Server'));
// app.listen(PORT, () => {
//   console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
// });