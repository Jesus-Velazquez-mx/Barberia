import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import * as userRepository from '../repositories/userRepository.js';
import { UserRole } from '../types/user.interface.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

export const registerSchema = z.object({
    name: z.string().min(2),
    lastname: z.string().min(2),
    phone: z.string().max(10).optional(),
    email: z.string().email(),
    password: z.string().min(6)
});

export const loginUser = async (data: any) => {
    const validData = loginSchema.parse(data);

    const user = await userRepository.getUserByEmail(validData.email);
    if (!user) {
        throw new Error('Invalid email or password');
    }

    const validPassword = await bcrypt.compare(validData.password, user.password_hash);
    if (!validPassword) {
        throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    const userData = {
        id: user.id,
        email: user.email,
        name: user.first_name,
        lastname: user.last_name,
        role: user.role
    };

    return {
        user: userData,
        token: token
    };
};

export const registerUser = async (data: any) => {
    const validData = registerSchema.parse(data);

    const userExists = await userRepository.getUserByEmail(validData.email);
    if (userExists) {
        throw new Error('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(validData.password, 10);

    const newUser = await userRepository.createUser({
        email: validData.email,
        password_hash: hashedPassword,
        first_name: validData.name, 
        last_name: validData.lastname, 
        phone: validData.phone || null,
        role: 'client' as UserRole
    });

    const userData = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.first_name,
        lastname: newUser.last_name,
        role: newUser.role
    };

    return userData;
};