//importer
import { Router } from "express";
import { db } from "../data/dynamoDb.js";
import type { Request, Response } from "express";
import type { User } from "../data/types.js";
import {
	isUser,
	UserSchema,
	UserArraySchema,
} from "../data/validationUsers.js";
import {
	QueryCommand,
	PutCommand,
	DeleteCommand,
	UpdateCommand,
	ScanCommand,
	GetCommand,
	type ScanCommandOutput,
	type GetCommandOutput,
} from "@aws-sdk/lib-dynamodb";

const router: Router = Router();
const tableName: string = "fullstack_grupparbete";

// Local types
type UserIdParam = {
	id: string;
};

//GET:id api/user/:id - Hämta en användare med id
router.get(
	"/:id",
	async (
		req: Request<UserIdParam>,
		res: Response<User | { message: string }>
	) => {
		try {
			const userId: string = `USER#${req.params.id}`;

			const getCommand = new GetCommand({
				TableName: tableName,
				Key: {
					PK: userId,
					SK: "PROFILE",
				},
			});

			const result: GetCommandOutput = await db.send(getCommand);

			const item = result.Item;
			if (!item) {
				res.status(404).json({ message: "Användare hittades inte" });
				return;
			}

			if (!isUser(item)) {
				console.error("Data matchar inte user");
				res.sendStatus(500);
				return;
			}

			return res.status(200).json(item);
		} catch (error) {
			console.error("Fel vid hämtning av användare:", error);
			res.status(500).json({ message: "Internt serverfel" });
		}
	}
);

//GET api/user - Hämta alla användare
router.get("/", async (req, res: Response<User[]>) => {
	const result: ScanCommandOutput = await db.send(
		new ScanCommand({
			TableName: tableName,
			FilterExpression: "SK = :profile",
			ExpressionAttributeValues: {
				":profile": "PROFILE",
			},
		})
	);

	if (!result.Items || result.Count === undefined) {
		res.sendStatus(500);
		return;
	}

	// Validera items med zod eller egen schema
	const parseResult = UserArraySchema.safeParse(result.Items);
	if (!parseResult.success) {
		console.error(
			"Resultat från databasen matchar inte User-array:",
			result.Items,
			parseResult.error
		);
		res.sendStatus(500);
		return;
	}

	const users: User[] = parseResult.data;
	res.send(users);
});

export default router;
