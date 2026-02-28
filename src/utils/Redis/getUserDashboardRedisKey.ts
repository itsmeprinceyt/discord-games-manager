import { getDBName } from "../Variables/getDBName.util";
import { getProduction } from "../Variables/getProduction.util";

export default function getUserDashboardRedisKey(): string {
  const value = getProduction();
  const dbName = getDBName();
  return `${dbName}:user_dashboard:${value}`;
}
