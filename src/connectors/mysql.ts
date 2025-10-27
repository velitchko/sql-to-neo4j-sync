import mysql from 'mysql2/promise';
import { SqlConfig, TableSchema, RowData } from '../types';

export class MySQLConnector {
  private config: SqlConfig;

  constructor(config: SqlConfig) {
    this.config = config;
  }

  async getConnection() {
    return mysql.createConnection(this.config);
  }

  async getTables(): Promise<string[]> {
    const conn = await this.getConnection();
    const [rows] = await conn.execute("SHOW TABLES");
    await conn.end();
    return rows.map((row: any) => Object.values(row)[0]);
  }

  async getTableSchema(table: string): Promise<TableSchema> {
    const conn = await this.getConnection();
    const [columnsRows] = await conn.execute(`SHOW COLUMNS FROM \`${table}\``);
    const [fkRows] = await conn.execute(
      `
      SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      `,
      [this.config.database, table]
    );

    await conn.end();

    const columns = columnsRows.map((col: any) => ({
      name: col.Field,
      type: col.Type
    }));

    const primaryKey = columnsRows.find((col: any) => col.Key === 'PRI')?.Field;

    const foreignKeys = fkRows.map((fk: any) => ({
      column: fk.COLUMN_NAME,
      references: {
        table: fk.REFERENCED_TABLE_NAME,
        column: fk.REFERENCED_COLUMN_NAME
      }
    }));

    return { name: table, columns, primaryKey, foreignKeys };
  }

  async getTableRows(table: string): Promise<RowData[]> {
    const conn = await this.getConnection();
    const [rows] = await conn.execute(`SELECT * FROM \`${table}\``);
    await conn.end();
    return rows as RowData[];
  }
}
