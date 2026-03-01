ALTER TABLE currency_crosstrades
ADD COLUMN trade_with_name VARCHAR(50) DEFAULT NULL AFTER traded_with,
ADD COLUMN trade_link_second VARCHAR(100) DEFAULT NULL AFTER trade_link;

ALTER TABLE crosstrades
ADD COLUMN trade_with_name VARCHAR(50) DEFAULT NULL;

ALTER TABLE currency_crosstrades
ADD COLUMN crosstrade_date VARCHAR(30) NOT NULL AFTER to_amount;

update database schema
pd_dump
