import { db, tableName } from "../data/dynamoDb.js";
import { readFileSync } from "fs";
import { PutCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

async function resetDatabase() {
  try { 
	console.log("Återställer databasen...");
	// Läs in SeedData.json
	const rawData = readFileSync('./serverSrc/data/seedData.json', 'utf-8');
	const seedData = JSON.parse(rawData);

	//hämta alla poster i tabellen
	const scanResult = await db.send(new ScanCommand({ TableName: tableName }));
	const items = scanResult.Items ?? [];

	//ta bort alla poster i tabellen
	for (const item of items) {
	  await db.send(new DeleteCommand({
		TableName: tableName,
		Key: {
		  PK: item.PK,
		  SK: item.SK
		}
	  }));
	}
	console.log("Borttagning av gamla poster klar.");

	//lägg till alla poster från seedData
	for (const item of seedData) {
	  await db.send(new PutCommand({
		TableName: tableName,
		Item: item
	  }));
	}
	console.log("Databasen är återställd med seed data.");

  } catch (error) {
	console.error("Fel vid återställning av databasen:", error);
  }
}

resetDatabase();