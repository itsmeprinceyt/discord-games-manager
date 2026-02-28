import { getDBName } from "../Variables/getDBName.util";
import { getProduction } from "../Variables/getProduction.util";

export default function getCrosstradeLogsRedisKey(): string {
  const value = getProduction();
  const dbName = getDBName();
  return `${dbName}:crosstrade_logs:${value}`;
}
