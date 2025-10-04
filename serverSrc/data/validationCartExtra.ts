import { z } from "zod";

// cartItemSchema -> validerar varje rad i kundvagnen
// id -> unikt id för kundvagnen
// userId -> den användare kundvagnen tillhör
// productId -> produkten som ligger i vagnen
// amount -> hur många av den produkten
export const cartSchema = z.object({
  id: z.string().nonempty("id krävs"),
  userId: z.string().nonempty("userId krävs"),
  productId: z.string().nonempty("productId krävs"),
  amount: z.number().int().positive("amount måste vara ett positivt heltal"),
});

// Validerar en array av kundvagnsposter
export const cartsSchema = z.array(cartSchema);

// Typdefinitioner (om du vill använda TypeScript)
export type Cart = z.infer<typeof cartSchema>;
export type Carts = z.infer<typeof cartsSchema>;