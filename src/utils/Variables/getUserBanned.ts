/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { authOptions } from "../../app/api/auth/[...nextauth]/route";
import { initServer, db } from "../../lib/initServer";

/**
 * Checks if the current user is banned by querying the database using session.user.id
 * @returns boolean - true if user is banned, false otherwise
 */
export async function isUserBanned(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return false;
    }

    await initServer();
    const pool = db();

    const [userCheck] = await pool.execute<any[]>(
      `SELECT is_banned FROM users WHERE id = ?`,
      [session.user.id]
    );

    if (!Array.isArray(userCheck) || userCheck.length === 0) {
      return false;
    }

    return Boolean(userCheck[0].is_banned);
  } catch (error) {
    console.error("Error checking user ban status:", error);
    return false;
  }
}
