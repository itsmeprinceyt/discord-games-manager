export interface BotWalletResponse {
  success: boolean;
  data: BotInfoResponse[];
  message?: string;
}

export interface BotInfoResponse {
  id: string;
  name: string;
  currency_name: string;
  balance: number;
  account_name?: string;
}
