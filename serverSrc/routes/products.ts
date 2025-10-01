// src/routes/products.ts
import express, { Router } from "express";
import type { Request, Response } from "express";
import { GetCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../data/dynamoDb.js";

import { ProductSchema, type ProductInput } from "../data/validationProduct.js";

const router: Router = express.Router();

// Get a single product by ID
router.get('/:productId', async (req: Request, res: Response) => {
    try {
        const productId = req.params.productId;
        const result = await db.send(new GetCommand({
            TableName: "fullstack_grupparbete",
            Key: {
                PK: `PRODUCT#${productId}`,
                SK: "METADATA"
            }
        }));

        if (result.Item) {
            res.json(result.Item);
        } else {
            res.status(404).json({ error: "product not found" });
        }
    } catch (error) {
        console.error("Error fetching single product:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get all products
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await db.send(new ScanCommand({
            TableName: "fullstack_grupparbete",
            FilterExpression: "begins_with(PK, :pk)",
            ExpressionAttributeValues: {
                ":pk": "PRODUCT#",
				// ":sk": "METADATA"
            }
        }));

        res.json(result.Items || []);
    } catch (error) {
        console.error("Error fetching all products:", error);
        res.status(500).json({ message: "could not fetch products", error: String(error) });
    }
});



// PUT 

const PartialProductSchema = ProductSchema.partial();

router.put('/:id', async (req, res) => {
  try {
    const parsed = PartialProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    let updates = parsed.data;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Det finns inget att uppdatera" });
    }

   
    delete (updates as any).id;
    delete (updates as any).PK;
    delete (updates as any).SK;

    
    const cleaned = Object.fromEntries(
      Object.entries(updates).filter(([, v]) =>
        v !== undefined &&
        v !== null &&
        !(typeof v === 'string' && v.trim() === '')
      )
    );

    
    if ('amountInStock' in cleaned) {
      const n = Number((cleaned as any).amountInStock);
      if (!isNaN(n)) {
        (cleaned as any).amountInStock = n;
      } else {
        
        return res.status(400).json({ error: "Amount måste vara ett nummer" });
      }
    }

    
    const exprNames: Record<string, string> = {};
    const exprValues: Record<string, any> = {};
    const sets: string[] = [];
    let i = 0;

    for (const [key, value] of Object.entries(cleaned)) {
      i++;
      const nameKey = `#name${i}`;
      const valueKey = `:value${i}`;
      exprNames[nameKey] = key;
      exprValues[valueKey] = value;
      sets.push(`${nameKey} = ${valueKey}`);
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: "Inga giltiga fält att uppdatera efter rensning" });
    }

    const productId = req.params.id;
    const out = await db.send(new UpdateCommand({
      TableName: "fullstack_grupparbete",
      Key: {
        PK: `PRODUCT#${productId}`,
        SK: "METADATA"
      },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ReturnValues: "ALL_NEW"
    }));

    if (!out.Attributes) {
      return res.status(404).json({ error: "Kunde inte uppdatera produkten" });
    }

    return res.json(out.Attributes);
  } catch (err) {
    console.error("Error med PUT /:productId:", err);
    return res.status(500).json({ error: "Internt serverfel", details: String(err) });
  }
});
// router.put(
//   '/:productId',
//   async (req: Request<{ productId: string }, any, ProductInput>, res: Response) => {
//     const productId = req.params.productId;

//     try {
      // Hämta befintlig produkt
      // const getRes = await db.send(new GetCommand({
      //   TableName: "fullstack_grupparbete",
      //   Key: { PK: `PRODUCT#${productId}`, SK: "METADATA" }
      // }));

      // if (!getRes.Item) {
      //   return res.status(404).json({ error: "Produkten hittas inte!" });
      // }

      // const existingProduct = getRes.Item;
      // console.log("PUT body received:", req.body);


      // Validera bodyn
      // let parsedData: ProductInput;
      // try {
      //   parsedData = ProductSchema.parse(req.body);
      // } catch (err: any) {
      //   const issues = err.errors?.map((e: any) => ({
      //     path: e.path.join('.'),
      //     message: e.message
      //   })) ?? [];
      //   return res.status(400).json({ error: "Valideringsfel", issues });
      // }
      // const validation = ProductSchema.safeParse(req.body);
      // if (!validation.success) {
      //   const issues = validation.error.issues.map(e => ({
      //     path: e.path.join('.') || '(root)',
      //     message: e.message,
      //   }));
      //   console.warn('Valideringsfel:', issues);
      //   return res.status(400).json({ error: "Valideringsfel", issues });
      // }
      // const parsedData = validation.data;

      // Kontrollera att id matchar URL
      // if (parsedData.id !== `PRODUCT#${productId}`) {
      //   return res.status(400).json({ error: "Produkt ID i URL och body måste vara samma" });
      // }

      //  Bygg objektet som ska sparas
      // const now = new Date().toISOString();
      // const itemToSave = {
      //   PK: `PRODUCT#${productId}`,
      //   SK: "METADATA",
      //   productId,
      //   name: parsedData.productName,
      //   price: parsedData.price,
      //   // url: parsedData.imageUrl,
      //   amountInStock: parsedData.amountInStock,
      //   createdAt: existingProduct.createdAt ?? now,
      //   updatedAt: now,
      // };

//       // Jämför relevant innehåll för att undvika onödig uppdatering
//       const existComparable = {
//         name: existingProduct.name,
//         price: existingProduct.price,
//         url: existingProduct.url ?? null,
//         amountInStock: existingProduct.amountInStock ?? 0
//       };

//       const newComparable = {
//         name: itemToSave.name,
//         price: itemToSave.price,
//         // url: itemToSave.url ?? null,
//         amountInStock: itemToSave.amountInStock ?? 0
//       };

//       if (JSON.stringify(existComparable) === JSON.stringify(newComparable)) {
//         return res.sendStatus(204); 
//       }

//       // Spara med PutCommand
//       await db.send(new PutCommand({
//         TableName: "fullstack_grupparbete",
//         Item: itemToSave
//       }));

//       //  Returnera den uppdaterade produkten
//       return res.status(200).json(itemToSave);

//     } catch (err) {
//       console.error("Error med PUT /:productId:", err);
//       return res.status(500).json({ error: "Internt serverfel", details: String(err) });
//     }
//   }
// );
export default router;






















