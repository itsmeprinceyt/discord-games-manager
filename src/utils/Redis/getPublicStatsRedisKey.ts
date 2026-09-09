import { getDBName } from "../Variables/getDBName.util";
import { getProduction } from "../Variables/getProduction.util";

export default function getPublicStatsRedisKey(): string {
  const value = getProduction();
  const dbName = getDBName();
  return `${dbName}:homepage_stats:${value}`;
}
