export interface Account {
  id: string;
  iban: string;
  masked: string;
  currency: string;
  availableBalance: number;
  status: string;
}

export interface AccountListResponse {
  items: Account[];
}

export interface AccountSelectOption {
  id: string;
  label: string;
}
