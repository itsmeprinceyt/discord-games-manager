import { getDBName } from "../Variables/getDBName.util";
import { getProduction } from "../Variables/getProduction.util";

export default function getCurrencyCrosstradeLogsRedisKeyAll(): string {
  const value = getProduction();
  const dbName = getDBName();
  return `${dbName}:currency_crosstrade_logs_all:${value}`;
}
