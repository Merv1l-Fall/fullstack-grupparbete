import * as z from "zod";
import type { User } from "./types.js";


const UserSchema = z.object({
    id: z.string().min(1, { message: "Användaren måste ha ett ID" }),
    name: z.string().min(1, { message: "Användaren måste ha ett namn" }),
});

export {UserSchema};


