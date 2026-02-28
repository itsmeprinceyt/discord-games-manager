import { getDBName } from "../Variables/getDBName.util";
import { getProduction } from "../Variables/getProduction.util";

export default function getCrosstrades(): string {
  const value = getProduction();
  const dbName = getDBName();
  return `${dbName}:user_single_account_crosstrades:${value}`;
}
