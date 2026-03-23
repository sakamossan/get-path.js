import { format } from "date-fns/format";

export function dateVars(date: Date) {
  return {
    YYYY: format(date, "yyyy"),
    YY: format(date, "yy"),
    MM: format(date, "MM"),
    DD: format(date, "dd"),
    WW: format(date, "II"),
    EEE: format(date, "EEE"),
  };
}
