// src/types/passport.d.ts
import { IUser } from "../interfaces/IUser";

declare module "passport" {
  interface Authenticator {
    user?: IUser;
  }

  namespace Express {
    interface User extends IUser {}
  }
}