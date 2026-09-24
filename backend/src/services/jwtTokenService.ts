import jwt from 'jsonwebtoken';
import { globalConfig } from '../server.js';
import { User } from '../types/entities/user.interface.js';

const signToken = (user: User) => {
    return jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        globalConfig.JWT_SECRET,
        { expiresIn: '8h' }
    );
}

// TODO
const decodeToken = (token: string) => jwt.verify(token, globalConfig.JWT_SECRET);

export { signToken, decodeToken };
