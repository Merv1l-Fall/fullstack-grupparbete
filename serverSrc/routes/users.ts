//importer
import { Router } from "express";
import { db, tableName } from "../data/dynamoDb.js";
import type { Request, Response } from "express";
import type { User, ResponseMessage } from "../data/types.js";
import { cryptoId } from "../utils/idGenerator.js";
import {
	UserSchema,
	UserArraySchema,
	UserNameSchema,
} from "../data/validationUsers.js";
import {
	PutCommand,
	DeleteCommand,
	UpdateCommand,
	ScanCommand,
	GetCommand,
	type ScanCommandOutput,
	type GetCommandOutput,
} from "@aws-sdk/lib-dynamodb";

const router: Router = Router();

// Local types
type UserIdParam = {
	id: string;
};
type CreateUserBody = {
	userName: string;
};

//GET:id api/user/:id - Hämta en användare med id
router.get(
	"/:id",
	async (
		req: Request<UserIdParam>,
		res: Response<User | ResponseMessage>
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

			if (!result.Item) {
				res.status(404).send({ message: "Användare hittades inte" });
				return;
			}

			const parsed = UserSchema.safeParse(result.Item);
			if (!parsed.success) {
				console.error("Valideringsfel:", parsed.error);
				return res
					.status(400)
					.send({ message: "Ogiltig användardata från databasen" });
			}

			return res.status(200).send(parsed.data);
		} catch (error) {
			console.error("Fel vid hämtning av användare:", error);
			res.status(500).send({ message: "Internt serverfel" });
		}
	}
);

//GET api/user - Hämta alla användare
router.get("/", async (req, res: Response<User[] | ResponseMessage>) => {
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

	// Validera items med zod
	const parseResult = UserArraySchema.safeParse(result.Items);
	if (!parseResult.success) {
		console.error(
			"Resultat från databasen matchar inte User-array:",
			result.Items,
			parseResult.error
		);
		res.status(400).send({
			message: "Ogiltig användardata från databasen",
		});
		return;
	}

	const users: User[] = parseResult.data;
	res.send(users);
});

//POST api/user - Skapa en användare

router.post("/", async (req: Request<CreateUserBody>, res: Response<ResponseMessage>) => {
	// Validera inkommande data
	const parseResult = UserNameSchema.safeParse(req.body);
	if (!parseResult.success) {
		res.status(400).send({ message: "Ogiltig användardata" });
		return;
	}
	const userData: CreateUserBody = parseResult.data;
	//slumpa ett Id till användaren och skapa objektet
	const randomId: string = cryptoId(8);
	const newUser: User = {
		PK: `USER#${randomId}`,
		SK: "PROFILE",
		userId: randomId,
		userName: userData.userName,
	};
	//spara i db
	try {
		const putCommand = new PutCommand({
			TableName: tableName,
			Item: newUser,
			ConditionExpression: "attribute_not_exists(PK)", // Förhindra överskrivning
		});
		await db.send(putCommand);
		res.status(201).send({ message: "Användare skapad" });
	} catch (error) {
		console.error("Fel vid skapande av användare:", error);
		res.status(500).send({ message: "Internt serverfel" });
	}
});

// PUT api/user/:id - Uppdatera en användare
router.put(
	"/:id",
	async (req: Request<UserIdParam>, res: Response<ResponseMessage>) => {
		const userId: string = `USER#${req.params.id}`;
		const userData: CreateUserBody = req.body;
		// Validera inkommande data
		const parseResult = UserNameSchema.safeParse(userData);
		if (!parseResult.success) {
			res.status(400).send({ message: "Ogiltig användardata" });
			return;
		}
		try {
			const updateCommand = new UpdateCommand({
				TableName: tableName,
				Key: {
					PK: userId,
					SK: "PROFILE",
				},
				UpdateExpression: "SET userName = :userName",
				ExpressionAttributeValues: {
					":userName": parseResult.data.userName,
				},
				ConditionExpression: "attribute_exists(PK)", // Säkerställ att användaren finns
			});
			await db.send(updateCommand);
			res.status(200).send({ message: "Användare uppdaterad" });
		} catch (error) {
			console.error("Fel vid uppdatering av användare:", error);
			res.status(500).send({ message: "Internt serverfel" });
		}
	}
);

// DELETE api/user/:id - Radera en användare
router.delete(
	"/:id",
	async (req: Request<UserIdParam>, res: Response<ResponseMessage>) => {
		const userId: string = `USER#${req.params.id}`;
		try {
			const deleteCommand = new DeleteCommand({
				TableName: tableName,
				Key: {
					PK: userId,
					SK: "PROFILE",
				},
				ConditionExpression: "attribute_exists(PK)", // Säkerställ att användaren finns
			});
			await db.send(deleteCommand);
			res.status(200).send({ message: "Användare raderad" });
		} catch (error: any) {

			if (error.name === "ConditionalCheckFailedException") {
				res.status(404).send({ message: "Användare hittades inte" });
				return;
			}
			console.error("Fel vid radering av användare:", error);
			res.status(500).send({ message: "Internt serverfel" });
		}
	}
);

export default router;
