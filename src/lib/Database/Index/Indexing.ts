export const createIndexStatements: string[] = [
  `CREATE INDEX idx_users_is_admin ON users(is_admin)`,
  `CREATE INDEX idx_users_created_at ON users(created_at)`,

  `CREATE INDEX idx_bot_accounts_name ON bot_accounts(name)`,
  `CREATE INDEX idx_bot_accounts_account_uid ON bot_accounts(account_uid)`,
  `CREATE INDEX idx_bot_accounts_voted_at ON bot_accounts(voted_at)`,
  `CREATE INDEX idx_bot_accounts_created_at ON bot_accounts(created_at)`,

  `CREATE INDEX idx_selected_bot_balance ON selected_bot(balance)`,
  `CREATE INDEX idx_selected_bot_last_crosstraded_at ON selected_bot(last_crosstraded_at)`,
  `CREATE INDEX idx_selected_bot_voted_at ON selected_bot(voted_at)`,

  `CREATE INDEX idx_crosstrades_crosstrade_date ON crosstrades(crosstrade_date)`,
  `CREATE INDEX idx_crosstrades_currency ON crosstrades(currency)`,
  `CREATE INDEX idx_crosstrades_crosstrade_via ON crosstrades(crosstrade_via)`,
  `CREATE INDEX idx_crosstrades_traded ON crosstrades(traded)`,
  `CREATE INDEX idx_crosstrades_paid ON crosstrades(paid)`,
  `CREATE INDEX idx_crosstrades_created_at ON crosstrades(created_at)`,
  `CREATE INDEX idx_crosstrades_traded_paid ON crosstrades(traded, paid)`,

  `CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type)`,
  `CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id)`,
  `CREATE INDEX idx_audit_logs_target_user_id ON audit_logs(target_user_id)`,
  `CREATE INDEX idx_audit_logs_actor_email ON audit_logs(actor_email)`,
  `CREATE INDEX idx_audit_logs_performed_at ON audit_logs(performed_at)`,
  `CREATE INDEX idx_audit_logs_action_performed ON audit_logs(action_type, performed_at)`,
];
export const dropIndexStatements: string[] = [
  `DROP INDEX idx_users_is_admin ON users`,
  `DROP INDEX idx_users_created_at ON users`,

  `DROP INDEX idx_bot_accounts_name ON bot_accounts`,
  `DROP INDEX idx_bot_accounts_account_uid ON bot_accounts`,
  `DROP INDEX idx_bot_accounts_voted_at ON bot_accounts`,
  `DROP INDEX idx_bot_accounts_created_at ON bot_accounts`,

  `DROP INDEX idx_selected_bot_balance ON selected_bot`,
  `DROP INDEX idx_selected_bot_last_crosstraded_at ON selected_bot`,
  `DROP INDEX idx_selected_bot_voted_at ON selected_bot`,

  `DROP INDEX idx_crosstrades_crosstrade_date ON crosstrades`,
  `DROP INDEX idx_crosstrades_currency ON crosstrades`,
  `DROP INDEX idx_crosstrades_crosstrade_via ON crosstrades`,
  `DROP INDEX idx_crosstrades_traded ON crosstrades`,
  `DROP INDEX idx_crosstrades_paid ON crosstrades`,
  `DROP INDEX idx_crosstrades_created_at ON crosstrades`,
  `DROP INDEX idx_crosstrades_traded_paid ON crosstrades`,

  `DROP INDEX idx_audit_logs_action_type ON audit_logs`,
  `DROP INDEX idx_audit_logs_actor_user_id ON audit_logs`,
  `DROP INDEX idx_audit_logs_target_user_id ON audit_logs`,
  `DROP INDEX idx_audit_logs_actor_email ON audit_logs`,
  `DROP INDEX idx_audit_logs_performed_at ON audit_logs`,
  `DROP INDEX idx_audit_logs_action_performed ON audit_logs`,
];
