// backend/src/autenticacion/password.helper.ts
import * as bcrypt from 'bcrypt';

export class PasswordHelper {
  static async hash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}