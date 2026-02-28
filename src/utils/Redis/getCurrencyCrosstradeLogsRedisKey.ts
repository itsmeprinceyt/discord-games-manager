import { getDBName } from "../Variables/getDBName.util";
import { getProduction } from "../Variables/getProduction.util";

export default function getCurrencyCrosstradeLogsRedisKey(): string {
  const value = getProduction();
  const dbName = getDBName();
  return `${dbName}:currency_crosstrade_logs:${value}`;
}
