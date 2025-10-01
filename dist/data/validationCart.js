import { z } from "zod";
// cartItemSchema -> validerar VARJE object i kundvagnen
// productId -> måste vara en sträng, som inte heller får vara tom
// amount -> måste vara ett POSITIVT HELTAL
export const cartItemSchema = z.object({
    productId: z.string().nonempty("productId krävs"),
    amount: z.number().int().positive("amount måste vara ett positivt heltal"),
});
// Här validerar vi hela kundvagnen som en array av cartItemSchema
// Vi gör det säkert att hela filen bara innehåller giltliga produkter (såsom definerat innan)
export const cartSchema = z.object({
    id: z.string().nonempty("id krävs"),
    userId: z.string().nonempty("userId krävs"),
    productId: z.string().nonempty("productId krävs"),
    amount: z.number().int().positive("amount måste vara ett positivt heltal"),
});
export const cartsSchema = z.array(cartSchema);
//# sourceMappingURL=validationCart.js.map