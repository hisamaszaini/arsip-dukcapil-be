import * as bcrypt from 'bcrypt';

export const hash = (plain: string) => bcrypt.hash(plain, 10);
export const verify = (plain: string, hashed: string) => bcrypt.compare(plain, hashed);