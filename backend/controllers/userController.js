import connection from '../connection/connection.js';
import sql from 'mssql';

/* Obtenemos el pool de conexiones */
const { getPool } = connection;

/* Función para listar a todos los usuarios */
const listarUsuarios = async (req, res) => {
    try {
        /* Sacamos el pool de conexiones */
        const pool = getPool();
        const sqlListarUsuarios = 'SELECT id, first_name, last_name, birthdate FROM USERS';
        /* Se usa pool.request().query para hacer peticiones */
        const resultado = await pool.request().query(sqlListarUsuarios);
        /* El resultado de la consulta se devuelve en el campo recordset */
        res.status(200).json(resultado.recordset);
    } catch (err) {
        res.status(500).json({ 'No se pudo listar los usuarios': err.message })
    }
}

/* Función para crear a un usuario */
const crearUsuario = async (req, res) => {
    try {
        const pool = getPool();
        const { first_name, last_name, birthdate } = req.body;
        /* No existen los '?' como en mysql, se usan los parametros con @*/
        const sqlCrearUsuario = 'INSERT INTO USERS (first_name, last_name, birthdate) VALUES (@first_name, @last_name, @birthdate)';
        /* Se usa el .input para pasar los parametros a la consulta y evitar inyección de SQL. Tambien se pone el tipo de dato en el .input */
        const resultado = await pool.request()
            .input('first_name', sql.NVarChar, first_name)
            .input('last_name', sql.NVarChar, last_name)
            .input('birthdate', sql.Date, birthdate)
            .query(sqlCrearUsuario);

        /* Podemos sacar el resultado con resultado.rowsAffected[0], ya que es un array */
        res.status(201).json({ 'Usuario creado': resultado.rowsAffected[0] });
    } catch (err) {
        res.status(500).json({ 'No se pudo crear el usuario': err.message })
    }
}

/* Función para actualizar a un usuario */
const actualizarUsuario = async (req, res) => {
    try {
        const pool = getPool();
        const { id, first_name, last_name, birthdate } = req.body;
        const sqlActualizarUsuario = 'UPDATE USERS SET first_name = @first_name, last_name = @last_name, birthdate = @birthdate WHERE id = @id';
        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .input('first_name', sql.NVarChar, first_name)
            .input('last_name', sql.NVarChar, last_name)
            .input('birthdate', sql.Date, birthdate)
            .query(sqlActualizarUsuario);
        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({ 'Usuario no encontrado': id });
        }

        res.status(200).json({ 'Usuario actualizado': resultado.rowsAffected[0] });
    } catch (err) {
        res.status(500).json({ 'No se pudo actualizar el usuario': err.message })
    }
}

/* Función para eliminar a un usuario */
const eliminarUsuario = async (req, res) => {
    try {
        const pool = getPool();
        const { id } = req.body;
        const sqlEliminarUsuario = 'DELETE FROM USERS WHERE id = @id';
        const resultado = await pool.request()
            .input('id', sql.Int, id)
            .query(sqlEliminarUsuario);
        if (resultado.rowsAffected[0] === 0) {
            return res.status(404).json({ 'Usuario no encontrado': id });
        }

        res.status(200).json({ 'Usuario eliminado': resultado.rowsAffected[0] });
    } catch (err) {
        res.status(500).json({ 'No se pudo eliminar el usuario': err.message })
    }
}

export default { listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario }