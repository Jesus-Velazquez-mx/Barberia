import type { Request, Response } from "express";
import aiService from '../services/aiService.js'

const testAiService = async (red: Request, res: Response) => {
    try {
        const result = await aiService.testConnection();
        res.status(200).json(result);
    } catch (error) {
        console.error('Error al conectar con el microservicio de IA:', error);
        res.status(500).json({ error: 'Error al conectar con el microservicio de IA' });
    }
}

export default { testAiService }
