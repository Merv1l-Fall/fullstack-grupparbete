
// GET, PUT, POST, DELETE etc för cart

import type { Request, Response } from "express";   // Importerar typer från Express
import { Router } from "express";                  // Router för att definiera routes
import express from "express";                     // Express-framework
import { cartItemSchema } from "../data/validationCart.js";  // Zod-schema för validering av cart items
import { db } from "../data/dynamoDb.js";         // DynamoDB-klient
import { GetCommand, PutCommand, DeleteCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"; // DynamoDB-kommandon
import { cryptoId } from "../utils/idGenerator.js";

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

router.get("/", async (req: Request<{}, {}, {}>, res: Response<CartItem[] | { message: string }>) => {
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

router.get("/:id", async (req: Request<{id:string}>, res: Response) => {
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

router.post("/", async (req: Request<{}, {}, {userId?:string}>, res: Response) => {
  try {
    // Använd userId från request, eller skapa nytt med cryptoId()
    const userId = req.body.userId || cryptoId(8); 
    const cartId = cryptoId(8); 

    const newCart = {
      PK: `USER#${userId}`,   // Partition key
      SK: `CART#${cartId}`,   // Sort key
      id: `CART#${cartId}`,   // Cart id
      userId: `USER#${userId}`
    };

    // Validering
    cartItemSchema.parse({ id: newCart.id, productId: "9", amount: 1 });

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newCart
      })
    );

    res.status(201).json(newCart);
  } catch (err: any) {
    console.error("DynamoDB Put error:", err);
    res.status(400).json({ message: err.message || "Fel vid skapande av cart" });
  }
});

//TODO: POST - lägg till cartItems i en cart!!!


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
    const PK = `USER#${userId}`;       
    const SK = `CART#${cartId}`;       

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

// DELETE - Rensa bort felaktiga carts (låter USERS och PRODUCTS vara ifred) -> (SE ÖVER DETTA, verkar ha tagit bort products och carts?)
router.delete("/cleanup/all", async (req: Request<{},{},{}>, res: Response) => {
  try {
    const result = await db.send(
      new ScanCommand({
        TableName: TABLE_NAME,
      })
    );

    let deleted: any[] = [];

    for (const item of result.Items || []) {
      // Vi rensar bara carts → alltså poster där SK börjar med CART#
      if (typeof item.SK === "string" && item.SK.startsWith("CART#")) {
        const pkOk = typeof item.PK === "string" && item.PK.startsWith("USER#");
        const skOk =
          typeof item.SK === "string" &&
          item.SK.startsWith("CART#") &&
          !item.SK.startsWith("CART#CART#"); // inga dubblade CART#

        const userIdOk = item.userId === item.PK; // userId måste matcha PK

        // Om något av villkoren inte stämmer → ta bort cart
        if (!pkOk || !skOk || !userIdOk) {
          await db.send(
            new DeleteCommand({
              TableName: TABLE_NAME,
              Key: { PK: item.PK, SK: item.SK }
            })
          );
          deleted.push({ PK: item.PK, SK: item.SK });
        }
      }
    }

    res.status(200).json({
      message: "Rensning klar endast carts har påverkats",
      deleted
    });
  } catch (err) {
    console.error("DynamoDB Cleanup error:", err);
    res.status(500).json({ message: "Fel vid rensning" });
  }
});

export default router; // Exporterar router för användning i server.ts

