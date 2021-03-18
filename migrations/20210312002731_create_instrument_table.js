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
const currencies = [
  'RUB' ,'USD', 'EUR', 'GBP', 'HKD', 'CHF', 'JPY', 'CNY', 'TRY'
];
const type = [
  'Stock', 'Currency', 'Bond', 'Etf'
];

exports.up = function(knex) {
  return knex.schema.createTable('Instrument', function(table) {
    table.string('name').notNullable();
    table.enum('type', type).notNullable();
    table.string('ticker').notNullable();
    table.string('isin').notNullable();
    table.decimal('minPriceIncrement').notNullable();
    table.integer('lot').notNullable();
    table.enum('currency', currencies).notNullable();
    table.string('figi').notNullable().unique().primary();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('Instrument');
};
