# sql-to-neo4j-sync

A Node.js library to read relational data from MySQL databases and sync/translate it into a Neo4j graph database.

## Features

- Connect to a MySQL database
- Read schema and data
- Map tables/relations to Neo4j nodes and relationships
- Push data into Neo4j using Cypher queries
- Extensible: add other database connectors easily

## Getting Started

```bash
npm install
cp .env.example .env
# Edit .env with your credentials
npm run build
```

## Configuration

Set up your connection credentials in `.env` (see `.env.example`).  
The app will load credentials from environment variables.

## Usage

See `src/index.ts` for usage examples.

## Roadmap

- [x] MySQL connector
- [x] Neo4j connector
- [ ] Add support for other origin databases
