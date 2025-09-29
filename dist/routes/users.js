//importer
import { Router } from "express";
import { db } from "../data/dynamoDb.js";
import { QueryCommand, PutCommand, DeleteCommand, UpdateCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
const router = Router();
const tableName = "fullstack_grupparbete";
// Endpoints
//GET api/user - Hämta alla användare
router.get('/', async (req, res) => {
    try {
        const command = new ScanCommand({
            TableName: tableName,
            FilterExpression: 'SK = :profile',
            ExpressionAttributeValues: {
                ':profile': 'PROFILE'
            }
        });
        const result = await db.send(command);
        const users = result.Items ?? [];
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Något gick fel' });
    }
});
//GET:id api/user/:id - Hämta en användare med id
router.get("/:id", async (req, res) => {
    try {
        const userId = `USER#${req.params.id}`;
        const command = new GetCommand({
            TableName: tableName,
            Key: {
                PK: userId,
                SK: "PROFILE",
            },
        });
        const result = await db.send(command);
        if (!result.Item) {
            return res.status(404).json({ message: "hittade ingen användare" });
        }
        res.status(200).json(result.Item);
    }
    catch (error) {
        console.error("DynamoDB error:", error);
        res.status(500).json({ message: "Något gick fel" });
    }
});
export default router;
//# sourceMappingURL=users.js.map