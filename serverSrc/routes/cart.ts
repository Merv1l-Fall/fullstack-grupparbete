//GET PUT POST DELETE etc för cart

import type { Request, Response } from "express";
import {Router} from "express"
import express from 'express';
import fs from "fs"; //-> TODO
import path from "path"; //-> TODO
import { cartItemSchema, cartsSchema } from "../data/validationCart.js"
import { v4 as uuidv4 } from "uuid"; //För unika id:n -> skapar unika id så vi slipper skriva en funktion fört

export interface CartItem{
    id: string;
    productId: string;
    amount: number;
}
export type Cart = CartItem[];

const router: Router = express.Router();

const cartFilePath:string = path.join(__dirname, "../data/cart.json") //En sökväg till cart.json i data-mappen

const readCartData = (): CartItem[] => {
  if (!fs.existsSync(cartFilePath)){
    return [];
  }
  const data = fs.readFileSync(cartFilePath, "utf-8");
  if (!data) return [];
  const parsedData = JSON.parse(data);
  return cartsSchema.parse(parsedData); //-> en array av carts/ typ:CartItem[]
};

const writeCartData = (data:CartItem[]): void => {
  fs.writeFileSync(cartFilePath, JSON.stringify(data, null, 2));
};

//GET - Hämta ALLA Kundvagnar/carts

router.get("/", (req: Request, res: Response<CartItem[]>) => {
  const carts = readCartData();
  res.status(200).json(carts);
});

// POST - Skapa en NY kundvagn

router.post("/", (req: Request<{}, {}, Omit<CartItem, "id">>, res: Response<CartItem | {message: string}>) =>{
  const carts = readCartData();
  const newCart = {...req.body, id: uuidv4()}; //Skapar unikt nytt ID

  try{
    cartItemSchema.parse(newCart);
  } catch(err:unknown){
    if (err instanceof Error){
    return res.status(400).json({message: err.message});
  }
    return res.status(400).json({message: "Ogiltig indata"});
}

  carts.push(newCart);
  writeCartData(carts);
  res.status(201).json(newCart);
});

//PUT - uppdatera antal för en kundvagn

router.put("/:id", (req: Request<{ id: string },{},{ amount: number }>, res:Response<CartItem | {message: string}>) => {
  const carts = readCartData();
  const { id } = req.params;
  const { amount } = req.body;

  try{
    cartItemSchema.shape.amount.parse(amount);
  } catch{
    return res.status(400).json({message: "amount måste vara ett POSITIVT heltal"})
  }

  const cart = carts.find((c) => c.id === id)
  if (!cart) {
    return res.status(404).json({message: "Kundvagn hittades inte"})
  }

  cart.amount = amount;
  writeCartData(carts);
  res.status(200).json(cart);
});

//DELETE - Ta bort en kundvagn

router.delete("/:id", (req: Request<{id:string}>, res: Response<{message:string}>) => {
  const carts = readCartData();
  const { id } = req.params;

  const newCarts = carts.filter((c) => c.id !== id);
  if (newCarts.length === carts.length){
    return res.status(404).json({message: "Kundvagnen hittades ej"});
  }

  writeCartData(newCarts);
  res.status(200).json({message: "Kundvagn har tagits bort"})
});

export default router
