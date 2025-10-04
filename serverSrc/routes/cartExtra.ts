import { Router } from "express";
import { db, tableName } from "../data/dynamoDb.js";
import type { Request, Response } from "express";
import {
  QueryCommand,
  type QueryCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { cartsSchema } from "../data/validationCartExtra.js";


const router: Router = Router();


type CartIdParam = {
  id: string;
};

router.get("/:id", async (req: Request<CartIdParam>, res: Response<{items?: any []} | { message: string }>) => { 
    try {const cartId = req.params.id;
    const pk = `CART#${cartId}`;

    const result: QueryCommandOutput = await db.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: {
          ":pk": pk,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return res.status(404).send({ message: "Kundvagn hittades inte" });
    }

    const parsedResult = cartsSchema.safeParse(result.Items);
    if (!parsedResult.success) {
      console.error("Valideringsfel:", parsedResult.error);
      return res.status(500).send({ message: "Fel vid validering av data" });
    } 

    res.status(200).send({ items: parsedResult.data });
} catch (error) {
    console.error("Fel vid hämtning av kundvagn:", error);
    res.status(500).send({ message: "Fel vid hämtning av kundvagn" });
  }
});

router.get(
  "/",
  async (
    req: Request,
    res: Response<{ carts?: any[] } | { message: string }>
  ) => {
    try {
      const result: QueryCommandOutput = await db.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "begins_with(PK, :pkPrefix)",
          ExpressionAttributeValues: { ":pkPrefix": "CART#" },
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return res.status(404).send({ message: "Inga kundvagnar hittades" });
      }

      const parsedResult = cartsSchema.safeParse(result.Items);
      if (!parsedResult.success) {
        console.error("Valideringsfel:", parsedResult.error);
        return res.status(500).send({ message: "Fel vid validering av data" });
      }

      return res.status(200).send({ carts: parsedResult.data });
    } catch (error) {
      console.error("Fel vid hämtning av kundvagnar:", error);
      res.status(500).send({ message: "Internt fel på server" });
    }
  }
);
export default router;