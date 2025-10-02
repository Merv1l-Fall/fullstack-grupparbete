
// GET, PUT, POST, DELETE etc för cart

import type { Request, Response } from "express";   // Importerar typer från Express
import { Router } from "express";                  // Router för att definiera routes
import express from "express";                     // Express-framework
import { cartItemSchema } from "../data/validationCart.js";  // Zod-schema för validering av cart items
import { v4 as uuidv4 } from "uuid";              // För att generera unika ID:n
import { db } from "../data/dynamoDb.js";         // DynamoDB-klient
import { GetCommand, PutCommand, DeleteCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"; // DynamoDB-kommandon

const TABLE_NAME = "fullstack_grupparbete";       // Namnet på DynamoDB-tabellen

// Definierar typer för cart items
export interface CartItem {
  id: string;
  productId: string;
  amount: number;
}
export type Cart = CartItem[];

const router: Router = express.Router();  // Skapar en router


// GET - Hämta ALLA carts

router.get("/", async (req: Request, res: Response<CartItem[] | { message: string }>) => {
  try {
    const result = await db.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(#sk, :prefix)",  // Filtrera för poster där SK börjar med "CART#"
        ExpressionAttributeNames: { "#sk": "SK" },      // Alias för SK eftersom SK är reserverat ord
        ExpressionAttributeValues: { ":prefix": "CART#" }, // Prefix att jämföra med
      })
    );

    // Returnera alla hittade carts eller en tom array
    res.status(200).json((result.Items as CartItem[]) || []);
  } catch (err) {
    console.error("DynamoDB Scan error:", err);
    res.status(500).json({ message: "Fel vid hämtning från DynamoDB" });
  }
});


// GET - Hämta en cart via ID

router.get("/:id", async (req, res) => {
  const { id } = req.params; // Ex: "CART#201"
  const userId = "USER#2";   // Här är användaren hårdkodad (kan göras dynamisk senare)

  try {
    const result = await db.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: "USER#2", SK: "CART#201" } // Hämtar specifik cart via PK och SK
      })
    );

    if (!result.Item) {
      return res.status(404).json({ message: "Kundvagn hittades inte" }); // Om ingen cart hittas
    }

    res.status(200).json(result.Item); // Returnerar cart
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Fel vid hämtning från DynamoDB" });
  }
});


// POST - Skapa en ny cart

router.post("/", async (req: Request<{}, {}, { userId: string }>, res: Response) => {
  const { userId } = req.body;  // Hämtar userId från request-body

  const cartId = "2011";  // Här sätts ett unikt cart-id (kan genereras dynamiskt med uuidv4) Jag vet att vi använder någonting Vilmer skapat, inte hunnit ändra det än bara

  // Skapar ett nytt cart-objekt
  const newCart = {
    PK: `USER#${userId}`,       // Partition key i DynamoDB
    SK: `CART#${cartId}`,       // Sort key
    id: `CART#${cartId}`,       // Samma som SK
    userId: `USER#${userId}`    // Användarens id
  };

  try {
    // Validering med Zod
    cartItemSchema.parse({ id: newCart.id, productId: "9", amount: 1 }); 

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newCart // Skickar cart till DynamoDB
      })
    );

    res.status(201).json(newCart); // Returnerar den skapade cart
  } catch (err: any) {
    console.error("DynamoDB Put error:", err);
    res.status(400).json({ message: err.message || "Fel vid skapande av cart" });
  }
});


// PUT - Uppdatera antal i cart

router.put("/:cartId/items/:productId", async (req: Request<{ productId: string }, {}, { amount: number, userId: string; }>, res: Response) => {
  const { productId } = req.params; // Hämtar productId från URL
  const { amount, userId } = req.body; // Hämtar amount och userId från body

  try {
    if (amount <= 0) { // Validerar att amount är positivt
      return res.status(400).json({ message: "Amount måste vara ett positivt heltal" });
    }

    const result = await db.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { 
          PK: `USER#${userId}`,   // Partition key för cart
          SK: `ITEM#${productId}` // Sort key för item
        },
        UpdateExpression: "SET amount = :a", // Uppdaterar amount
        ExpressionAttributeValues: {
          ":a": amount
        },
        ReturnValues: "ALL_NEW" // Returnerar det uppdaterade objektet
      })
    );

    if (!result.Attributes) {
      return res.status(404).json({ message: "Cart item hittades inte" }); // Om item inte hittas
    }

    res.status(200).json(result.Attributes); // Returnerar uppdaterat item
  } catch (err: any) {
    console.error("DynamoDB Update error:", err);
    res.status(500).json({ message: "Fel vid uppdatering" });
  }
});


// DELETE - Ta bort en cart

router.delete("/:cartId", async (req: Request<{ cartId: string, userId: string }>, res: Response) => {
  const { cartId, userId } = req.params; // Hämtar cartId och userId från URL

  try {
    const PK = `USER#${userId}`;       // Partition key
    const SK = `CART#${cartId}`;       // Sort key

    await db.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK, SK }, // Tar bort cart från DynamoDB
      })
    );

    res.status(200).json({ message: `Cart ${cartId} har tagits bort` }); 
  } catch (err) {
    console.error("DynamoDB Delete error:", err);
    res.status(500).json({ message: "Fel vid borttagning" });
  }
});

export default router; // Exporterar router för användning i app.ts/server

