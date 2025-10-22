import { MySQLConnector } from './connectors/mysql';
import { Neo4jConnector } from './connectors/neo4j';
import { SqlConfig, Neo4jConfig } from './types';

export async function syncMySQLToNeo4j(mysqlConfig: SqlConfig, neo4jConfig: Neo4jConfig) {
  const mysql = new MySQLConnector(mysqlConfig);
  const neo4j = new Neo4jConnector(neo4jConfig);

  const tables = await mysql.getTables();

  // First pass: create nodes for every row
  const tableRows: Record<string, any[]> = {};
  for (const table of tables) {
    const schema = await mysql.getTableSchema(table);
    const rows = await mysql.getTableRows(table);
    tableRows[table] = rows;

    for (const row of rows) {
      const properties = Object.entries(row)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ');

      const cypher = `MERGE (n:${table} {${properties}})`;
      await neo4j.runCypher(cypher);
    }
  }

  // Second pass: create relationships with properties from foreign keys
  for (const table of tables) {
    const schema = await mysql.getTableSchema(table);
    const fkList = schema.foreignKeys || [];
    const rows = tableRows[table];

    for (const fk of fkList) {
      for (const row of rows) {
        // Relationship properties: include the FK value and all row props if desired
        const relProps = Object.entries(row)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(', ');

        const fromId = row[fk.column];
        // Find the matching target row(s) by referenced column value
        const targetTableRows = tableRows[fk.references.table] || [];
        const targets = targetTableRows.filter(targetRow => targetRow[fk.references.column] === fromId);

        for (const targetRow of targets) {
          // Node match by PKs
          const fromMatch = Object.entries(row)
            .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
            .join(', ');

          const toMatch = `${fk.references.column}: ${JSON.stringify(targetRow[fk.references.column])}`;

          const cypher = `
            MATCH (a:${table} {${fromMatch}})
            MATCH (b:${fk.references.table} {${toMatch}})
            MERGE (a)-[r:${fk.column}_TO_${fk.references.table} {${relProps}}]->(b)
          `;
          await neo4j.runCypher(cypher);
        }
      }
    }
  }

  await neo4j.close();
}