import { Request, Response } from 'express';
import * as userServices from '../services/userService.js';

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await userServices.loginUser(req.body);
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        if (error.errors) {
            res.status(400).json({ success: false, errors: error.errors });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await userServices.registerUser(req.body);
        
        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        if (error.errors) {
            res.status(400).json({ success: false, errors: error.errors });
        } else {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};