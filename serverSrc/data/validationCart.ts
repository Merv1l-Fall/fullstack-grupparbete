import { z } from "zod";

// cartItemSchema -> validerar VARJE object i kundvagnen
// productId -> måste vara en sträng, som inte heller får vara tom
// amount -> måste vara ett POSITIVT HELTAL
export const cartItemSchema = z.object({
  cartId: z.string().nonempty(),
  productId: z.string().nonempty(),
  amount: z.number().int().positive(),
  PK: z.string().nonempty(),
  SK: z.string().nonempty(),
  userId: z.string().optional(),
})

// Här validerar vi hela kundvagnen som en array av cartItemSchema

export const cartSchema = z.object({
  cartId: z.string().nonempty(),
  PK: z.string().nonempty(),
  SK: z.string().nonempty(),
  userId: z.string().optional(),
})

export const cartsSchema = z.array(cartSchema);
export const cartItemsSchema = z.array(cartItemSchema);

export const updateCartItemParamsSchema = z.object({
  productId: z.string().nonempty("productId krävs"),
  cartId: z.string().nonempty("cartId krävs")
});

export const updateCartItemBodySchema = z.object({
  amount: z.number().int().positive("amount måste vara ett positivt heltal"),
  userId: z.string().nonempty("userId krävs")
});
// Vi genererar TS-typer automatiskt från schemat

//Lägg till FRÅN validationCart.ts och använd dem som interface i cart.ts

export type CartItem = z.infer<typeof cartItemSchema>;
export type Carts = z.infer<typeof cartsSchema>;