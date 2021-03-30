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
exports.up = function(knex) {
  return knex.schema.createTable('InstrumentHistory', function(table) {
    table.uuid('id').defaultTo(knex.raw('uuid_generate_v4()')).primary();
    table.string('figi').notNullable();
    table.decimal('buyPrice').notNullable();
    table.string('buyOrderId');
    table.decimal('buyComission');
    table.decimal('sellPrice');
    table.decimal('sellComission');
    table.string('sellOrderId');
    table.foreign('figi').references('Instrument.figi');
    table.timestamp('createdAt',{ useTz: false }).defaultTo(knex.fn.now());
  });
};

// select ticker, volume, name from public."Instrument" as inv, public."InstrumentHistory" as invhist
// where inv.figi = invhist.figi
exports.down = function(knex) {
  return knex.schema.dropTable('InstrumentHistory');
};
