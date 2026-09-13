import db from '../connection/connection.js';
import { User } from '../types/user.interface.js';

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const pool = db.getPool();
    
    const query = `
        SELECT id, role, email, phone, password_hash, first_name, last_name, is_active, deleted_at, created_at, updated_at 
        FROM users 
        WHERE email = $1 
        AND deleted_at IS NULL 
        AND is_active = true
    `;
    
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
        return null;
    }
    
    return result.rows[0];
};

export const createUser = async (userData: any): Promise<User> => {
    const pool = db.getPool();
    
    const query = `
        INSERT INTO users (role, email, phone, password_hash, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, role, email, phone, password_hash, first_name, last_name, is_active, deleted_at, created_at, updated_at
    `;
    
    const values = [
        userData.role, 
        userData.email, 
        userData.phone, 
        userData.password_hash, 
        userData.first_name, 
        userData.last_name
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
};