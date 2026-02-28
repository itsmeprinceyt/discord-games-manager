import { getDBName } from "../Variables/getDBName.util";
import { getProduction } from "../Variables/getProduction.util";

export default function getAnalyticsLogsRedisKey(): string {
  const value = getProduction();
  const dbName = getDBName();
  return `${dbName}:analytics_logs:${value}`;
}
