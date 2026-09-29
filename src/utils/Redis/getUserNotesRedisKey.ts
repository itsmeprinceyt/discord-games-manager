import { getDBName } from "../Variables/getDBName.util";
import { getProduction } from "../Variables/getProduction.util";

export default function getUserNotes(): string {
  const value = getProduction();
  const dbName = getDBName();
  return `${dbName}:user_notes:${value}`;
}
