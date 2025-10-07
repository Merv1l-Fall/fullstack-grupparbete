import * as z from "zod";
const UserSchema = z.object({
    userId: z.string().min(1, { message: "Användaren måste ha ett ID" }),
    userName: z.string().min(1, { message: "Användaren måste ha ett namn" }),
    SK: z.literal("PROFILE"),
    PK: z.string().min(1),
});
const UserArraySchema = z.array(UserSchema);
const UserNameSchema = z.object({
    userName: z.string().min(1, { message: "Användaren måste ha ett namn" }),
});
export { UserSchema, UserArraySchema, UserNameSchema };
//# sourceMappingURL=validationUsers.js.map