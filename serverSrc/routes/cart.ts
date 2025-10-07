// GET, PUT, POST, DELETE etc för cart

import type { Request, Response } from "express";   // Importerar typer från Express
import { Router } from "express";                  // Router för att definiera routes
import express from "express";                     // Express-framework
import type { Cart, CartItem, Carts, UpdateCartItemBody, UpdateCartItemParams, AddCartItemBody  } from "../data/validationCart.js";  // Typdefinitioner
import { cartItemSchema, cartSchema, cartsSchema, updateCartItemBodySchema, updateCartItemParamsSchema, addCartItemBodySchema } from "../data/validationCart.js";
import { db, tableName } from "../data/dynamoDb.js";         // DynamoDB-klient
import { GetCommand, PutCommand, DeleteCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb"; // DynamoDB-kommandon
import { z } from "zod";

const idParamSchema = z.object({
  id: z.string().nonempty("id-parametern krävs"),
});

const router: Router = express.Router();  // Skapar en router

// GET - Hämta ALLA carts
router.get("/", async (req: Request, res: Response<Carts | { message: string; error?: any }>) => {
  try {
    const result = await db.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "begins_with(#sk, :prefix)",
        ExpressionAttributeNames: { "#sk": "SK" },
        ExpressionAttributeValues: { ":prefix": "CART#" },
      })
    );

    const items = (result.Items || []).filter(item => item.SK.startsWith("CART#"));
    const parsed = cartsSchema.safeParse(items);

    if (parsed.success) {
      return res.status(200).json(parsed.data as Carts);
    }
    const tree = z.treeifyError(parsed.error);
    return res.status(400).json({ message: "Felaktig data från databasen", error: tree });
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
    res: Response<{ message?: string; error?: any } | Cart & { items: CartItem[] }>
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

    const cartSK = `CART#${id}`;

    try {
      const result = await db.send(
        new GetCommand({
          TableName: tableName,
          Key: { PK: userId, SK: cartSK },
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

      const itemsResult = await db.send(
        new ScanCommand({
          TableName: tableName,
          FilterExpression: "begins_with(SK, :itemPrefix) AND PK = :pk",
          ExpressionAttributeValues: {
            ":itemPrefix": "ITEM#",
            ":pk": `CART#${id}`,
          }
        })
      );

      const items: CartItem[] = (itemsResult.Items || [])
        .map(item => cartItemSchema.safeParse(item))
        .filter(p => p.success)
        .map(p =>({ ...p.data, userId: p.data.userId!}));

      return res.status(200).json({ ...(parsed.data as Cart), items });
    } catch (err) {
      console.error("DynamoDB GET error:", err);
      return res.status(500).json({ message: "Fel vid hämtning från DynamoDB" });
    }
  }
);

// POST - Lägg ett item i en cart
router.post(
  "/:cartId/items",
  async (req: Request<{ cartId: string }, {}, AddCartItemBody>, res: Response) => {
    try {
      const { cartId } = z.object({ cartId: z.string().nonempty("cartId krävs") }).parse(req.params);
      const { productId, amount, userId } = addCartItemBodySchema.parse(req.body);

      const productResult = await db.send(
        new GetCommand({ TableName: tableName, Key: { PK: productId, SK: "METADATA" } })
      );
      if (!productResult.Item) return res.status(404).json({ message: `Produkt ${productId} hittades inte` });

      const existingItem = await db.send(
        new GetCommand({ TableName: tableName, Key: { PK: `CART#${cartId}`, SK: `ITEM#${productId}` } })
      );

      if (existingItem.Item) {
        const newAmount = (existingItem.Item.amount || 0) + amount;
        const updateResult = await db.send(
          new UpdateCommand({
            TableName: tableName,
            Key: { PK: `CART#${cartId}`, SK: `ITEM#${productId}` },
            UpdateExpression: "SET amount = :a",
            ExpressionAttributeValues: { ":a": newAmount },
            ReturnValues: "ALL_NEW",
          })
        );
        return res.status(200).json({
          message: `Uppdaterade ${productId} till mängd ${newAmount} i cart ${cartId}`,
          item: updateResult.Attributes as CartItem,
        });
      }

      const newCartItem: CartItem = {
        PK: `CART#${cartId}`,
        SK: `ITEM#${productId}`,
        cartId,
        productId,
        amount,
        userId,
      };

      cartItemSchema.parse(newCartItem);

      await db.send(new PutCommand({ TableName: tableName, Item: newCartItem }));

      return res.status(201).json({
        message: `Produkt ${productId} har lagts till i kundvagn ${cartId}`,
        item: newCartItem,
      });
    } catch (err: any) {
      console.error("DynamoDB Add Item error:", err);
      if (err instanceof z.ZodError) {
        const errors = err.issues.map(e => ({
          field: e.path.join('.') || 'body',
          message: e.message
        }));
        return res.status(400).json({ message: "Valideringsfel i request-data", details: errors });
      }
      res.status(500).json({ message: "Fel vid tillägg av produkt till cart" });
    }
  }
);

// PUT - Uppdatera antal i cart
router.put(
  "/:cartId/items/:productId",
  async (req: Request<UpdateCartItemParams, {}, UpdateCartItemBody>, res: Response<CartItem | { message: string; error?: any }>) => {
    try {
      const { cartId, productId } = updateCartItemParamsSchema.parse(req.params);
      const { amount, userId } = updateCartItemBodySchema.parse(req.body);

      const result = await db.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { PK: `CART#${cartId}`, SK: `ITEM#${productId}` },
          UpdateExpression: "SET amount = :a, userId = :u",
          ExpressionAttributeValues: { ":a": amount, ":u": userId },
          ReturnValues: "ALL_NEW",
        })
      );

      if (!result.Attributes) return res.status(404).json({ message: "Cart item hittades inte" });

      const parsed = cartItemSchema.safeParse(result.Attributes);
      if (!parsed.success) return res.status(400).json({ message: "Felaktig cart item-data", error: parsed.error });

      res.status(200).json(parsed.data as CartItem);
    } catch (err: any) {
      console.error("DynamoDB Update error:", err);
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Valideringsfel", error: err });
      res.status(500).json({ message: "Fel vid uppdatering" });
    }
  }
);

// DELETE - Ta bort en cart
router.delete(
  "/:cartId",
  async (req: Request<{ cartId: string; userId: string }>, res: Response<{ message: string; error?: any }>) => {
    try {
      const params = z.object({
        cartId: z.string().nonempty("cartId krävs"),
        userId: z.string().nonempty("userId krävs"),
      }).parse(req.params);

      const PK = `USER#${params.userId}`;
      const SK = `CART#${params.cartId}`;

      await db.send(new DeleteCommand({ TableName: tableName, Key: { PK, SK } }));

      res.status(200).json({ message: `Cart ${params.cartId} har tagits bort` });
    } catch (err: any) {
      console.error("DynamoDB Delete error:", err);
      if (err instanceof z.ZodError) return res.status(400).json({ message: "Valideringsfel", error: err });
      res.status(500).json({ message: "Fel vid borttagning" });
    }
  }
);

// DELETE - Rensa bort felaktiga carts / Tog bort denna koden då den inte längre är relevant - också med risk för att ta bort saker igen mot min vilja



export default router;


