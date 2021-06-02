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
import OpenAPI from '@tinkoff/invest-openapi-js-sdk';
// const dotenv = require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

const apiURL = 'https://api-invest.tinkoff.ru/openapi';
const sandboxApiURL = 'https://api-invest.tinkoff.ru/openapi/sandbox/';
const socketURL = 'wss://api-invest.tinkoff.ru/openapi/md/v1/md-openapi/ws';
const secretToken = process.env.TOKEN; // токен для боевого api
// const secretToken = null; // токен для боевого api
const sandboxToken = process.env.SANDBOX_TOKEN; // токен для сандбокса

export default !!secretToken && secretToken !== 'empty' ? new OpenAPI({ apiURL, secretToken, socketURL }) : new OpenAPI({ apiURL: sandboxApiURL, secretToken: sandboxToken as string, socketURL });


