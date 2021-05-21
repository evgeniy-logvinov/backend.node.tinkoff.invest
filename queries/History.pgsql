select
  "name",
  to_char("createdAt", 'yyyy/mm/dd HH24:MM:SS'),
  "buyPrice",
  "buyComission",
  "sellPrice",
  "sellComission",
  "tax",
  "sellPrice" - "sellComission" - "buyPrice" - "buyComission" as profit,
  instHist.type
from "Instrument" as inst, "InstrumentHistory" as instHist
where inst.figi = instHist.figi
-- and "sellPrice" is null
order by "name"
-- Продажа по цене но покупка не выше предыдущей продажи по линии
-- проверить нефть