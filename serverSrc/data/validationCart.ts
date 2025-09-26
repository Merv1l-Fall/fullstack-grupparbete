import { z } from "zod";

// cartItemSchema -> validerar VARJE object i kundvagnen
// productId -> måste vara en sträng, som inte heller får vara tom
// quantity -> måste vara ett POSITIVT HELTAL
export const cartItemSchema = z.object({
  productId: z.string().nonempty("productId krävs"),
  quantity: z.number().int().positive("quantity måste vara ett positivt heltal"),
});

// Här validerar vi hela kundvagnen som en array av cartItemSchema
// Vi gör det säkert att hela filen bara innehåller giltliga produkter (såsom definerat innan)
export const cartSchema = z.array(cartItemSchema);

// Vi genererar TS-typer automatiskt från schemat
// CartItem och Cart kan användas i koden för typkontroll
export type CartItem = z.infer<typeof cartItemSchema>;
export type Cart = z.infer<typeof cartSchema>;