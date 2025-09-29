//importer
import { Router } from "express";
import { db } from "../data/dynamoDb.js";
import type { Request, Response } from "express";
import type { User } from "../data/types.js";
import { QueryCommand, PutCommand, DeleteCommand, UpdateCommand, ScanCommand, GetCommand } from "@aws-sdk/lib-dynamodb";


const router: Router = Router();
const tableName: string = "fullstack_grupparbete";

// Local types
type UserIdParam = {
	id: string;
};

// Endpoints

//GET api/user - Hämta alla användare
router.get('/', async (req, res: Response) => {
	try {
		const command = new ScanCommand({
			TableName: tableName,
			FilterExpression: 'SK = :profile',
			ExpressionAttributeValues: {
				':profile': 'PROFILE'
			}
		});
		const result = await db.send(command);
		const users: User[] = (result.Items as User[]) ?? [];
		res.status(200).json(users);
	}
	catch (error) {
		res.status(500).json({ message: 'Något gick fel' });
	}
});

//GET:id api/user/:id - Hämta en användare med id
router.get("/:id", async (req: Request<UserIdParam>, res: Response) => {
  try {
    const userId: string = `USER#${req.params.id}`;

    const command = new GetCommand({
      TableName: tableName,
      Key: {
        PK: userId,
        SK: "PROFILE",
      },
    });

    const result = await db.send(command);

    if (!result.Item) {
      return res.status(404).json({ message: "Hittade ingen användare" });
    }

    res.status(200).json(result.Item);
  } catch (error) {
    console.error("DynamoDB error:", error);
    res.status(500).json({ message: "Något gick fel" });
  }
});

export default router;