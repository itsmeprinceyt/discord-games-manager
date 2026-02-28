/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { initServer, db } from "../../../../lib/initServer";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getRedis } from "../../../../lib/Redis/redis";
import getAnalyticsLogsRedisKey from "../../../../utils/Redis/getAnalyticsLogsRedisKey";
import { ANALYTICS_LOGS_TTL } from "../../../../utils/Redis/redisTTL";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    await initServer();
    const redis = getRedis();
    const cacheKey = `${getAnalyticsLogsRedisKey()}:${session.user.id}`;

    const cached = await redis.get<typeof responseData>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
      });
    }

    const pool = db();

    const [crosstrades] = await pool.execute<any[]>(
      `SELECT 
        id,
        crosstrade_date,
        currency,
        amount_received,
        rate,
        conversion_rate,
        net_amount,
        traded_with,
        trade_link,
        note
       FROM crosstrades 
       WHERE user_id = ?
       ORDER BY crosstrade_date DESC`,
      [session.user.id]
    );

    if (!crosstrades || crosstrades.length === 0) {
      const emptyData = {
        yearly_analytics: [],
        monthly_analytics: [],
        summary: {
          total_trades: 0,
          total_usd_amount: 0,
          total_inr_amount: 0,
          total_usd_converted_to_inr: 0,
          total_combined_inr: 0,
          average_trade_value_inr: 0,
          currency_breakdown: {
            usd: { count: 0, total: 0 },
            inr: { count: 0, total: 0 },
          },
        },
      };
      await redis.set(cacheKey, emptyData, { ex: ANALYTICS_LOGS_TTL });
      return NextResponse.json({ success: true, data: emptyData });
    }

    const monthlyData: Record<string, any> = {};
    const yearlyData: Record<string, any> = {};
    let totalUSD = 0;
    let totalINR = 0;
    let totalUSDConvertedToINR = 0;
    let totalTrades = 0;
    let usdTradesCount = 0;
    let inrTradesCount = 0;

    crosstrades.forEach((trade: any) => {
      const date = new Date(trade.crosstrade_date);
      const monthYear = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthName = date.toLocaleString("default", { month: "long" });
      const year_num = date.getFullYear();
      const yearKey = String(year_num);

      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: monthName,
          year: year_num,
          month_code: monthYear,
          trade_count: 0,
          total_usd_amount: 0,
          total_inr_amount: 0,
          total_usd_converted_to_inr: 0,
          total_combined_inr: 0,
          trades: [],
        };
      }

      if (!yearlyData[yearKey]) {
        yearlyData[yearKey] = {
          year: year_num,
          year_code: yearKey,
          trade_count: 0,
          total_usd_amount: 0,
          total_inr_amount: 0,
          total_usd_converted_to_inr: 0,
          total_combined_inr: 0,
          usd_trades_count: 0,
          inr_trades_count: 0,
        };
      }

      let usdAmount = 0;
      let inrAmount = 0;
      let usdConvertedToINR = 0;

      if (trade.currency === "usd") {
        usdTradesCount++;
        usdAmount = parseFloat(trade.net_amount) || 0;
        totalUSD += usdAmount;
        monthlyData[monthYear].total_usd_amount += usdAmount;
        yearlyData[yearKey].total_usd_amount += usdAmount;
        yearlyData[yearKey].usd_trades_count++;

        if (
          trade.conversion_rate &&
          !isNaN(parseFloat(trade.conversion_rate))
        ) {
          const conversionRate = parseFloat(trade.conversion_rate);
          usdConvertedToINR = usdAmount * conversionRate;
          totalUSDConvertedToINR += usdConvertedToINR;
          monthlyData[monthYear].total_usd_converted_to_inr +=
            usdConvertedToINR;
          yearlyData[yearKey].total_usd_converted_to_inr += usdConvertedToINR;
        }
      } else if (trade.currency === "inr") {
        inrTradesCount++;
        inrAmount = parseFloat(trade.net_amount) || 0;
        totalINR += inrAmount;
        monthlyData[monthYear].total_inr_amount += inrAmount;
        yearlyData[yearKey].total_inr_amount += inrAmount;
        yearlyData[yearKey].inr_trades_count++;
      }

      const combinedINR = inrAmount + usdConvertedToINR;
      monthlyData[monthYear].total_combined_inr += combinedINR;
      monthlyData[monthYear].trade_count++;
      yearlyData[yearKey].total_combined_inr += combinedINR;
      yearlyData[yearKey].trade_count++;

      monthlyData[monthYear].trades.push({
        id: trade.id,
        date: trade.crosstrade_date,
        currency: trade.currency,
        amount_received: parseFloat(trade.amount_received) || 0,
        net_amount: parseFloat(trade.net_amount) || 0,
        conversion_rate: trade.conversion_rate
          ? parseFloat(trade.conversion_rate)
          : null,
        usd_converted_to_inr: usdConvertedToINR > 0 ? usdConvertedToINR : null,
        combined_inr_value: combinedINR > 0 ? combinedINR : null,
        traded_with: trade.traded_with,
        rate: trade.rate,
        note: trade.note,
      });

      totalTrades++;
    });

    const monthlyAnalytics = Object.values(monthlyData).sort((a: any, b: any) =>
      b.month_code.localeCompare(a.month_code)
    );

    const yearlyAnalytics = Object.values(yearlyData)
      .map((y: any) => ({
        ...y,
        total_usd_amount: parseFloat(y.total_usd_amount.toFixed(2)),
        total_inr_amount: parseFloat(y.total_inr_amount.toFixed(2)),
        total_usd_converted_to_inr: parseFloat(
          y.total_usd_converted_to_inr.toFixed(2)
        ),
        total_combined_inr: parseFloat(y.total_combined_inr.toFixed(2)),
        average_trade_value_inr:
          y.trade_count > 0
            ? parseFloat((y.total_combined_inr / y.trade_count).toFixed(2))
            : 0,
      }))
      .sort((a: any, b: any) => b.year - a.year);

    const totalCombinedINR = totalINR + totalUSDConvertedToINR;
    const averageTradeValue =
      totalTrades > 0 ? totalCombinedINR / totalTrades : 0;

    const responseData = {
      yearly_analytics: yearlyAnalytics,
      monthly_analytics: monthlyAnalytics,
      summary: {
        total_trades: totalTrades,
        total_usd_amount: parseFloat(totalUSD.toFixed(2)),
        total_inr_amount: parseFloat(totalINR.toFixed(2)),
        total_usd_converted_to_inr: parseFloat(
          totalUSDConvertedToINR.toFixed(2)
        ),
        total_combined_inr: parseFloat(totalCombinedINR.toFixed(2)),
        average_trade_value_inr: parseFloat(averageTradeValue.toFixed(2)),
        currency_breakdown: {
          usd: {
            count: usdTradesCount,
            total: parseFloat(totalUSD.toFixed(2)),
            percentage:
              totalTrades > 0
                ? ((usdTradesCount / totalTrades) * 100).toFixed(1)
                : 0,
          },
          inr: {
            count: inrTradesCount,
            total: parseFloat(totalINR.toFixed(2)),
            percentage:
              totalTrades > 0
                ? ((inrTradesCount / totalTrades) * 100).toFixed(1)
                : 0,
          },
        },
      },
      meta: {
        user_id: session.user.id,
        total_months: monthlyAnalytics.length,
        total_years: yearlyAnalytics.length,
      },
    };

    await redis.set(cacheKey, responseData, { ex: ANALYTICS_LOGS_TTL });

    return NextResponse.json({ success: true, data: responseData });
  } catch (error: unknown) {
    console.error("Analytics logs error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
