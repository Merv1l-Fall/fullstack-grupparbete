import * as z from "zod";
import type { User } from "./types.js";


const UserSchema = z.object({
    userId: z.string().min(1, { message: "Användaren måste ha ett ID" }),
    userName: z.string().min(1, { message: "Användaren måste ha ett namn" }),
	SK: z.literal("PROFILE"),
	PK: z.string().min(1),
});

const UserArraySchema = z.array(UserSchema);

function isUser(item: unknown): item is User {
	try {
		UserSchema.parse(item);
		return true;
	} catch (e) {
		return false;
	}
}


export {UserSchema, UserArraySchema, isUser};


