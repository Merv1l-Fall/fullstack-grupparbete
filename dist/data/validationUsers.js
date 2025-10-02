import * as z from "zod";
const UserSchema = z.object({
    id: z.string().min(1, { message: "Användaren måste ha ett ID" }),
    name: z.string().min(1, { message: "Användaren måste ha ett namn" }),
});
export { UserSchema };
//# sourceMappingURL=validationUsers.js.map