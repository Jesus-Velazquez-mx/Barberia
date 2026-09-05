import testRepository from '../repositories/testRepository.js';

/* Capa de servicio: reglas de negocio. Orquesta la capa de datos y no conoce Express (req/res) */

/* Función para listar test */
const listarTest = async () => {
    return testRepository.findAll();
}

/* Función para crear test */
const crearTest = async (idTest: number, fieldTest: string) => {
    return testRepository.create(idTest, fieldTest);
}

/* Función para editar test */
const editarTest = async (idTest: number, fieldTest: string) => {
    return testRepository.update(idTest, fieldTest);
}

/* Función para eliminar test */
const eliminarTest = async (idTest: number) => {
    return testRepository.remove(idTest);
}

export default { listarTest, crearTest, editarTest, eliminarTest };
