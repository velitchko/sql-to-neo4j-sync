import neo4j from 'neo4j-driver';
import { Neo4jConfig } from '../types';

export class Neo4jConnector {
  private driver: neo4j.Driver;

  constructor(config: Neo4jConfig) {
    this.driver = neo4j.driver(config.uri, neo4j.auth.basic(config.user, config.password));
  }

  async runCypher(statement: string, params: any = {}) {
    const session = this.driver.session();
    try {
      const result = await session.run(statement, params);
      return result;
    } finally {
      await session.close();
    }
  }

  async close() {
    await this.driver.close();
  }
}