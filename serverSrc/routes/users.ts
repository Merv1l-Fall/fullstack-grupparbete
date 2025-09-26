//importer
import { Router } from "express";
import { db } from "../data/dynamoDb.js";
import { QueryCommand, PutCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";


const router: Router = Router();
const tableName: string = "fullstack_grupparbete";

// Endpoints

//GET api/users - Hämta alla användare
router.get('/', async (req, res) => {
	try {
		const command = new QueryCommand({
			TableName: tableName,
			KeyConditionExpression: "SK = :profile",
			ExpressionAttributeValues: { ":profile": "PROFILE" },
			IndexName: "SK-index",
		});
		const result = await db.send(command);
		res.status(200).json(result.Items);
	}
	catch (error) {
		res.status(500).json({ message: 'Något gick fel' });
	}
});