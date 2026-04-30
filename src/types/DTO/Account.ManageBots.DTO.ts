export interface BotSelection {
  id: string;
  name: string;
  currency: string;
  isSelected: boolean;
  selectedBotId?: string;
  blacklisted?: boolean;
}

export interface BotSelectionMeta {
  total: number;
  selected: number;
  accountId: string;
  accountName: string;
}

export interface BotSelectionResponse {
  success: true;
  data: BotSelection[];
  meta: BotSelectionMeta;
}
