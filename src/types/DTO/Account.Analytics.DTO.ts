export interface Trade {
  id: string;
  date: string;
  currency: "usd" | "inr";
  amount_received: number;
  net_amount: number;
  conversion_rate: number | null;
  usd_converted_to_inr: number | null;
  combined_inr_value: number | null;
  traded_with: string | null;
  rate: string | null;
  note: string | null;
}

export interface YearlyAnalytics {
  year: number;
  year_code: string;
  trade_count: number;
  total_usd_amount: number;
  total_inr_amount: number;
  total_usd_converted_to_inr: number;
  total_combined_inr: number;
  usd_trades_count: number;
  inr_trades_count: number;
  average_trade_value_inr: number;
}

export interface MonthlyAnalytics {
  month: string;
  year: number;
  month_code: string;
  trade_count: number;
  total_usd_amount: number;
  total_inr_amount: number;
  total_usd_converted_to_inr: number;
  total_combined_inr: number;
  trades: Trade[];
}

export interface CurrencyBreakdown {
  count: number;
  total: number;
  percentage: string | number;
}

export interface AnalyticsSummary {
  total_trades: number;
  total_usd_amount: number;
  total_inr_amount: number;
  total_usd_converted_to_inr: number;
  total_combined_inr: number;
  average_trade_value_inr: number;
  currency_breakdown: {
    usd: CurrencyBreakdown;
    inr: CurrencyBreakdown;
  };
}

export interface AnalyticsMeta {
  user_id: string;
  username: string;
  account_id: string;
  total_months: number;
  total_years: number;
}

export interface AnalyticsData {
  yearly_analytics: YearlyAnalytics[];
  monthly_analytics: MonthlyAnalytics[];
  summary: AnalyticsSummary;
  meta: AnalyticsMeta;
}

export interface AnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
}

export interface PieChartDataPoint {
  name: string;
  value: number;
  percentage: number;
  currency: string;
  color: string;
}

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: PieChartDataPoint }>;
}
