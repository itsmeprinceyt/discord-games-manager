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

    const processedTrades = crosstrades.map((trade: any) => {
      const netAmount = parseFloat(trade.net_amount) || 0;
      const conversionRate = trade.conversion_rate
        ? parseFloat(trade.conversion_rate)
        : null;

      let usdAmount = 0;
      let inrAmount = 0;
      let usdConvertedToINR = 0;

      if (trade.currency === "usd") {
        usdAmount = netAmount;
        if (conversionRate) {
          usdConvertedToINR = Number((usdAmount * conversionRate).toFixed(2));
        }
      } else if (trade.currency === "inr") {
        inrAmount = netAmount;
      }

      const combinedINR = Number((inrAmount + usdConvertedToINR).toFixed(2));

      return {
        ...trade,
        net_amount_parsed: netAmount,
        conversion_rate_parsed: conversionRate,
        usd_amount: usdAmount,
        inr_amount: inrAmount,
        usd_converted_to_inr: usdConvertedToINR,
        combined_inr_value: combinedINR,
      };
    });

    const monthlyData: Record<string, any> = {};
    const yearlyData: Record<string, any> = {};
    let totalUSD = 0;
    let totalINR = 0;
    let totalUSDConvertedToINR = 0;
    let totalCombinedINR = 0;
    let totalTrades = 0;
    let usdTradesCount = 0;
    let inrTradesCount = 0;

    processedTrades.forEach((trade: any) => {
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

      if (trade.currency === "usd") {
        usdTradesCount++;
        totalUSD += trade.usd_amount;
        monthlyData[monthYear].total_usd_amount += trade.usd_amount;
        yearlyData[yearKey].total_usd_amount += trade.usd_amount;
        yearlyData[yearKey].usd_trades_count++;

        totalUSDConvertedToINR += trade.usd_converted_to_inr;
        monthlyData[monthYear].total_usd_converted_to_inr +=
          trade.usd_converted_to_inr;
        yearlyData[yearKey].total_usd_converted_to_inr +=
          trade.usd_converted_to_inr;
      } else if (trade.currency === "inr") {
        inrTradesCount++;
        totalINR += trade.inr_amount;
        monthlyData[monthYear].total_inr_amount += trade.inr_amount;
        yearlyData[yearKey].total_inr_amount += trade.inr_amount;
        yearlyData[yearKey].inr_trades_count++;
      }

      totalCombinedINR += trade.combined_inr_value;
      monthlyData[monthYear].total_combined_inr += trade.combined_inr_value;
      monthlyData[monthYear].trade_count++;
      yearlyData[yearKey].total_combined_inr += trade.combined_inr_value;
      yearlyData[yearKey].trade_count++;

      monthlyData[monthYear].trades.push({
        id: trade.id,
        date: trade.crosstrade_date,
        currency: trade.currency,
        amount_received: parseFloat(trade.amount_received) || 0,
        net_amount: trade.net_amount_parsed,
        conversion_rate: trade.conversion_rate_parsed,
        usd_converted_to_inr:
          trade.usd_converted_to_inr > 0 ? trade.usd_converted_to_inr : null,
        combined_inr_value:
          trade.combined_inr_value > 0 ? trade.combined_inr_value : null,
        traded_with: trade.traded_with,
        rate: trade.rate,
        note: trade.note,
      });

      totalTrades++;
    });

    const monthlyAnalytics = Object.values(monthlyData)
      .map((month: any) => ({
        ...month,
        total_usd_amount: Number(month.total_usd_amount.toFixed(2)),
        total_inr_amount: Number(month.total_inr_amount.toFixed(2)),
        total_usd_converted_to_inr: Number(
          month.total_usd_converted_to_inr.toFixed(2)
        ),
        total_combined_inr: Number(month.total_combined_inr.toFixed(2)),
        trades: month.trades.map((trade: any) => ({
          ...trade,
          amount_received: Number(trade.amount_received.toFixed(2)),
          net_amount: Number(trade.net_amount.toFixed(2)),
          usd_converted_to_inr: trade.usd_converted_to_inr
            ? Number(trade.usd_converted_to_inr.toFixed(2))
            : null,
          combined_inr_value: trade.combined_inr_value
            ? Number(trade.combined_inr_value.toFixed(2))
            : null,
        })),
      }))
      .sort((a: any, b: any) => b.month_code.localeCompare(a.month_code));

    const yearlyAnalytics = Object.values(yearlyData)
      .map((year: any) => ({
        ...year,
        total_usd_amount: Number(year.total_usd_amount.toFixed(2)),
        total_inr_amount: Number(year.total_inr_amount.toFixed(2)),
        total_usd_converted_to_inr: Number(
          year.total_usd_converted_to_inr.toFixed(2)
        ),
        total_combined_inr: Number(year.total_combined_inr.toFixed(2)),
        average_trade_value_inr:
          year.trade_count > 0
            ? Number((year.total_combined_inr / year.trade_count).toFixed(2))
            : 0,
      }))
      .sort((a: any, b: any) => b.year - a.year);

    const averageTradeValue =
      totalTrades > 0 ? totalCombinedINR / totalTrades : 0;

    const responseData = {
      yearly_analytics: yearlyAnalytics,
      monthly_analytics: monthlyAnalytics,
      summary: {
        total_trades: totalTrades,
        total_usd_amount: Number(totalUSD.toFixed(2)),
        total_inr_amount: Number(totalINR.toFixed(2)),
        total_usd_converted_to_inr: Number(totalUSDConvertedToINR.toFixed(2)),
        total_combined_inr: Number(totalCombinedINR.toFixed(2)),
        average_trade_value_inr: Number(averageTradeValue.toFixed(2)),
        currency_breakdown: {
          usd: {
            count: usdTradesCount,
            total: Number(totalUSD.toFixed(2)),
            percentage:
              totalTrades > 0
                ? Number(((usdTradesCount / totalTrades) * 100).toFixed(1))
                : 0,
          },
          inr: {
            count: inrTradesCount,
            total: Number(totalINR.toFixed(2)),
            percentage:
              totalTrades > 0
                ? Number(((inrTradesCount / totalTrades) * 100).toFixed(1))
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
