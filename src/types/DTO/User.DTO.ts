export interface SelectedBot {
  id: string;
  name: string;
  currency_name: string;
}

export interface BotAccount {
  id: string;
  name: string;
  account_uid: string | null;
  selected_bots: SelectedBot[];
}

export interface UserWithBotStats {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string | null;
  bot_accounts: BotAccount[];
}

export interface UsersWithBotStatsResponse {
  success: boolean;
  data: {
    users: UserWithBotStats[];
    pagination: {
      current_page: number;
      items_per_page: number;
      total_items: number;
      total_pages: number;
      has_next: boolean;
      has_previous: boolean;
    };
  };
  error?: string;
}
