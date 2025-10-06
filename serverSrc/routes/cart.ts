
// GET, PUT, POST, DELETE etc för cart

import type { Request, Response } from "express";   // Importerar typer från Express
import { Router } from "express";                  // Router för att definiera routes
import express from "express";                     // Express-framework
import { cartItemSchema, cartsSchema, cartSchema, updateCartItemBodySchema, updateCartItemParamsSchema } from "../data/validationCart.js";  // Zod-schema för validering av cart items
import { db } from "../data/dynamoDb.js";         // DynamoDB-klient
import { GetCommand, PutCommand, DeleteCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"; // DynamoDB-kommandon
import { cryptoId } from "../utils/idGenerator.js";
import { z } from "zod";

const TABLE_NAME = "fullstack_grupparbete";       // Namnet på DynamoDB-tabellen

// Definierar typer för cart items
export interface CartItem {
  id: string;
  productId: string;
  amount: number;
}
export type Cart = CartItem[];

const idParamSchema = z.object({
  id: z.string().nonempty("id-parametern krävs"),
});

const router: Router = express.Router();  // Skapar en router


// GET - Hämta ALLA carts

router.get("/", async (req: Request<{}, {}, {}>, res: Response<z.infer<typeof cartsSchema> | {message: string; error?: any}>) => {
  try {
    const result = await db.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "begins_with(#sk, :prefix)",  // Filtrera för poster där SK börjar med "CART#"
        ExpressionAttributeNames: { "#sk": "SK" },      // Alias för SK eftersom SK är reserverat ord
        ExpressionAttributeValues: { ":prefix": "CART#" }, // Prefix att jämföra med
      })
    );

    const items = (result.Items || []).filter(item => item.SK.startsWith("CART#"));
    const parsed = cartsSchema.safeParse(items);

    if(!parsed.success) {
        const tree = z.treeifyError(parsed.error);
        return res.status(400).json({message: "Felaktig data från databasen", error: tree })
    }

    // Returnera alla hittade carts eller en tom array
    res.status(200).json(parsed.data);
  } catch (err) {
    console.error("DynamoDB Scan error:", err);
    res.status(500).json({ message: "Fel vid hämtning från DynamoDB" });
  }
});


// GET - Hämta en cart via ID

router.get(
  "/:id",
  async (
    req: Request<{ id: string }, {}, {}, { userId?: string }>,
    res: Response<{ message?: string; error?: any } | z.infer<typeof cartSchema>>
  ) => {

    const paramsResult = idParamSchema.safeParse(req.params);
    if (!paramsResult.success) {
      const tree = z.treeifyError(paramsResult.error);
      console.error("Valideringsfel i params:", tree);
      return res.status(400).json({ message: "Ogiltlig id-parameter", error: tree });
    }

    const { id } = paramsResult.data;


    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: "userId krävs som query-param" });
    }

    const SK = `CART#${id}`;

    try {
      const result = await db.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { PK: userId, SK },
        })
      );

      if (!result.Item) {
        return res.status(404).json({ message: "Kundvagn hittades inte" });
      }


      const parsed = cartSchema.safeParse(result.Item);
      if (!parsed.success) {
        const tree = z.treeifyError(parsed.error);
        console.error("Valideringsfel i DynamoDB-data:", tree);
        return res.status(400).json({ message: "Felaktig cart-data från databasen", error: tree });
      }

      return res.status(200).json(parsed.data);
    } catch (err) {
      console.error("DynamoDB GET error:", err);
      return res.status(500).json({ message: "Fel vid hämtning från DynamoDB" });
    }
  }
);


// POST - Skapa en ny cart

router.post("/", async (req: Request<{}, {}, {userId?:string}>, res: Response) => {
  try {
    const bodySchema = z.object({
        userId: z.string().nonempty("userId krävs"),
    })
    const parsedBody = bodySchema.parse(req.body);
    const userId = parsedBody.userId;
    const cartId = cryptoId(8);
    // Använd userId från request, eller skapa nytt med cryptoId()


    const newCart = {
      PK: `USER#${userId}`,   // Partition key
      SK: `CART#${cartId}`,   // Sort key
      cartId: `CART#${cartId}`,   // Cart id
      userId: `USER#${userId}`
    };

    // Validering
    cartSchema.parse(newCart);

    await db.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: newCart,
      })
    );

    res.status(201).json(newCart);
  } catch (err: any) {
    console.error("DynamoDB Put error:", err);
    res.status(400).json({ message: err.message || "Fel vid skapande av cart" });
  }
});

//TODO: POST - Lägg ett item i en cart
//Exempel body: { "productId": "PRODUCT#2", "amount": 3, "cartId": "2" }

router.post(
  "/:cartId/items",
  async (
    req: Request<{ cartId: string }, {}, { productId: string; amount: number; userId: string }>,
    res: Response
  ) => {
    try {
      const paramsSchema = z.object({
        cartId: z.string().nonempty("cartId krävs"),
      });

      const { cartId } = paramsSchema.parse(req.params);

      const bodySchema = z.object({
        productId: z.string().nonempty("productId krävs"),
        amount: z.number().int().positive("amount måste vara ett positivt heltal"),
        userId: z.string().nonempty("userId krävs"),
      });

      const { productId, amount, userId } = bodySchema.parse(req.body);

      const productResult = await db.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: productId,
            SK: "METADATA",
          },
        })
      );

      if (!productResult.Item) {
        return res.status(404).json({ message: `Produkt ${productId} hittades inte` });
      }

      const existingItem = await db.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: `CART#${cartId}`,
            SK: `ITEM#${productId}`,
          },
        })
      );

      if (existingItem.Item) {
        const newAmount = (existingItem.Item.amount || 0) + amount;

        const updateResult = await db.send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: {
              PK: `CART#${cartId}`,
              SK: `ITEM#${productId}`,
            },
            UpdateExpression: "SET amount = :a",
            ExpressionAttributeValues: {
              ":a": newAmount,
            },
            ReturnValues: "ALL_NEW",
          })
        );

        return res.status(200).json({
          message: `Uppdaterade ${productId} till mängd ${newAmount} i cart ${cartId}`,
          item: updateResult.Attributes,
        });
      }

      const newCartItem = {
        PK: `CART#${cartId}`,
        SK: `ITEM#${productId}`,
        cartId: `CART#${cartId}`,
        productId,
        amount,
        userId
      };

      cartItemSchema.parse(newCartItem);

      await db.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: newCartItem,
        })
      );

      res.status(201).json({
        message: `Produkt ${productId} har lagts till i kundvagn ${cartId}`,
        item: newCartItem,
      });
    } catch (err: any) {
      console.error("DynamoDB Add Item error:", err);


      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Valideringsfel",
          error: err,
        });
      }

      res.status(500).json({ message: "Fel vid tillägg av produkt till cart" });
    }
  }
);

// PUT - Uppdatera antal i cart

router.put("/:cartId/items/:productId", async (req: Request<{ productId: string }, {}, { amount: number, userId: string; }>, res: Response) => {

  try {
    const {cartId, productId} = updateCartItemParamsSchema.parse(req.params); // Hämtar productId och cartId från URL
    const { amount, userId } = updateCartItemBodySchema.parse(req.body); // Hämtar amount och userId från body

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
    if (err instanceof z.ZodError){
        return res.status(400).json({message:"Valideringsfel", error: err});
    }
    res.status(500).json({message: "Fel vid uppdatering"});
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

        // Om något av villkoren inte stämmer, ta bort cart
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

