import jwt from 'jsonwebtoken';
import { globalConfig } from '../server.js';
import { decodeToken } from './jwtTokenService.js';


export type UpdateUserInput = {
    id: string,
    email?: string,
    phone?: string,
    password?: string,
    firstName?: string,
    lastName?: string,
}

const updateUser = async (user: UpdateUserInput, token: string) => {
    return decodeToken(token);
}

export { updateUser };