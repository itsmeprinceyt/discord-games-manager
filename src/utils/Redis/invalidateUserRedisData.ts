import { getRedis } from "../../lib/Redis/redis";
import getAnalyticsLogsRedisKey from "./getAnalyticsLogsRedisKey";
import getCrosstradeLogsRedisKey from "./getCrosstradeLogsRedisKey";
import getCrosstrades from "./getCrosstrades";
import getCurrencyCrosstradeLogsRedisKey from "./getCurrencyCrosstradeLogsRedisKey";
import getCurrencyCrosstradeLogsRedisKeyAll from "./getCurrencyCrosstradeLogsRedisKeyAll";
import getSingleAnalyticsLogsRedisKey from "./getSingleAnalyticsLogsRedisKey";
import getUserDashboardRedisKey from "./getUserDashboardRedisKey";
import getUserSingleAccountDashboardRedisKey from "./getUserSingleAccountDashboardRedisKey";
import getWalletInfo from "./getWalletInfo";

export async function invalidateUserCache(userId: string): Promise<void> {
  const redis = getRedis();

  const keys = [
    `${getAnalyticsLogsRedisKey()}:${userId}`,
    `${getUserDashboardRedisKey()}:${userId}`,
  ];

  const crosstradeKeys = await redis.keys(
    `${getCrosstradeLogsRedisKey()}:${userId}:*`
  );

  const botAccountKeys = await redis.keys(
    `${getUserSingleAccountDashboardRedisKey()}:${userId}:*`
  );

  const accountTradeKeys = await redis.keys(`${getCrosstrades()}:${userId}:*`);

  const botWalletInfoKeys = await redis.keys(`${getWalletInfo()}:${userId}:*`);

  const analyticsAccountKeys = await redis.keys(
    `${getSingleAnalyticsLogsRedisKey()}:${userId}:*`
  );

  const currencyLogs = await redis.keys(
    `${getCurrencyCrosstradeLogsRedisKey()}:${userId}:*`
  );

  const currencyLogsAll = await redis.keys(
    `${getCurrencyCrosstradeLogsRedisKeyAll()}:${userId}:*`
  );

  const allKeys = [
    ...keys,
    ...crosstradeKeys,
    ...botAccountKeys,
    ...accountTradeKeys,
    ...botWalletInfoKeys,
    ...analyticsAccountKeys,
    ...currencyLogs,
    ...currencyLogsAll,
  ];

  if (allKeys.length > 0) {
    await redis.del(...allKeys);
  }
}
