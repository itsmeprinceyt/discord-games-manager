import { getDBName } from "../Variables/getDBName.util";
import { getProduction } from "../Variables/getProduction.util";

export default function getWalletInfo(): string {
  const value = getProduction();
  const dbName = getDBName();
  return `${dbName}:account_bot_wallet:${value}`;
}
