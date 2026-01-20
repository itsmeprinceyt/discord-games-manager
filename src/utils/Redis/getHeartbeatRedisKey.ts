import { getDBName } from "../Variables/getDBName.util";
import { getProduction } from "../Variables/getProduction.util";

export default function getHeartbeatRedisKey(): string {
  const value = getProduction();
  const dbName = getDBName();
  return `${dbName}:heartbeat_last_check:${value}`;
}
