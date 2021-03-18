select * from "Instrument" as inst, "InstrumentHistory" as instHist
where inst.figi = instHist.figi