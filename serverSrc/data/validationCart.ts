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

export const updateCartItemParamsSchema = z.object({
  productId: z.string().nonempty("productId krävs"),
  cartId: z.string().nonempty("cartId krävs")
});

export const updateCartItemBodySchema = z.object({
  amount: z.number().int().positive("amount måste vara ett positivt heltal"),
  userId: z.string().nonempty("userId krävs")
});

export const createCartBodySchema = z.object({
  userId: z.string().nonempty("userId krävs"),
});

export interface CartItem {
  cartId: string;
  productId: string;
  amount: number;
  PK: string;
  SK: string;
  userId?: string;
}

export interface Cart {
  cartId: string;
  PK: string;
  SK: string;
  userId?: string;
}

export const addCartItemBodySchema = z.object({
  productId: z.string().nonempty("productId krävs"),
  amount: z.number().int().positive("amount måste vara ett positivt heltal"),
  userId: z.string().nonempty("userId krävs"),
});

export interface AddCartItemBody {
  productId: string;
  amount: number;
  userId: string;
}

export type Carts = Cart[];
export type UpdateCartItemParams = z.infer<typeof updateCartItemParamsSchema>;
export type UpdateCartItemBody = z.infer<typeof updateCartItemBodySchema>;
export type CreateCartBody = z.infer<typeof createCartBodySchema>;
