import * as z from "zod";
declare const UserSchema: z.ZodObject<{
    userId: z.ZodString;
    userName: z.ZodString;
    SK: z.ZodLiteral<"PROFILE">;
    PK: z.ZodString;
}, z.core.$strip>;
declare const UserArraySchema: z.ZodArray<z.ZodObject<{
    userId: z.ZodString;
    userName: z.ZodString;
    SK: z.ZodLiteral<"PROFILE">;
    PK: z.ZodString;
}, z.core.$strip>>;
declare const UserNameSchema: z.ZodObject<{
    userName: z.ZodString;
}, z.core.$strip>;
export { UserSchema, UserArraySchema, UserNameSchema };
//# sourceMappingURL=validationUsers.d.ts.map