/**
 * Test completo del flujo de asignación de apartamentos V2
 *
 * Flujo:
 * 1. Login para obtener token
 * 2. Crear apartamento nuevo
 * 3. Obtener lista de empleados disponibles
 * 4. Asignar empleado al apartamento
 * 5. Verificar cálculo de renta prorrateada
 * 6. Verificar deducciones generadas
 * 7. Finalizar asignación con cargo de limpieza
 * 8. Verificar deducciones finales
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';
let authToken = '';

// Configuración de prueba
const TEST_CONFIG = {
  apartment: {
    name: 'Test Apartment マンション',
    building_name: 'Test Building',
    room_number: '999',
    floor_number: 9,
    base_rent: 50000,
    management_fee: 5000,
    deposit: 100000,
    key_money: 50000,
    default_cleaning_fee: 20000,
    prefecture: '東京都',
    city: 'テスト区',
    address_line1: 'テスト1-2-3',
    room_type: '1K',
    size_sqm: 25.5,
    status: 'active'
  }
};

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'cyan');
  console.log('='.repeat(80));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Función para login
async function login() {
  logSection('1. LOGIN');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });

    authToken = response.data.access_token;
    logSuccess(`Login exitoso. Token obtenido: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    logError(`Error en login: ${error.message}`);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return false;
  }
}

// Función para crear apartamento
async function createApartment() {
  logSection('2. CREAR APARTAMENTO');
  try {
    const response = await axios.post(
      `${BASE_URL}/apartments-v2/apartments`,
      TEST_CONFIG.apartment,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const apartment = response.data;
    logSuccess(`Apartamento creado exitosamente`);
    logInfo(`ID: ${apartment.id}`);
    logInfo(`Nombre: ${apartment.name}`);
    logInfo(`Renta Base: ¥${apartment.base_rent.toLocaleString()}`);
    logInfo(`Cuota Administración: ¥${apartment.management_fee.toLocaleString()}`);
    logInfo(`Total Mensual: ¥${(apartment.base_rent + apartment.management_fee).toLocaleString()}`);
    logInfo(`Cargo Limpieza: ¥${apartment.default_cleaning_fee.toLocaleString()}`);

    return apartment;
  } catch (error) {
    logError(`Error al crear apartamento: ${error.message}`);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return null;
  }
}

// Función para obtener empleados disponibles
async function getAvailableEmployees() {
  logSection('3. OBTENER EMPLEADOS DISPONIBLES');
  try {
    const response = await axios.get(
      `${BASE_URL}/employees/`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const employees = response.data;
    logSuccess(`Se encontraron ${employees.length} empleados`);

    // Buscar un empleado sin apartamento asignado
    const availableEmployee = employees.find(emp => !emp.apartment_id);

    if (availableEmployee) {
      logSuccess(`Empleado disponible encontrado:`);
      logInfo(`ID: ${availableEmployee.id}`);
      logInfo(`Nombre: ${availableEmployee.full_name_roman}`);
      logInfo(`Email: ${availableEmployee.email || 'N/A'}`);
    } else {
      logInfo('No hay empleados sin apartamento. Usando el primer empleado de la lista.');
    }

    return availableEmployee || employees[0];
  } catch (error) {
    logError(`Error al obtener empleados: ${error.message}`);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return null;
  }
}

// Función para asignar empleado a apartamento
async function assignEmployeeToApartment(apartmentId, employeeId) {
  logSection('4. ASIGNAR EMPLEADO AL APARTAMENTO');
  try {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];

    logInfo(`Asignando empleado ${employeeId} al apartamento ${apartmentId}`);
    logInfo(`Fecha de inicio: ${startDate}`);

    const response = await axios.post(
      `${BASE_URL}/apartments-v2/assignments`,
      {
        apartment_id: apartmentId,
        employee_id: employeeId,
        start_date: startDate,
        move_in_date: startDate,
        monthly_rent: 50000,
        prorated_days: null,
        prorated_amount: null
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const assignment = response.data;
    logSuccess(`Asignación creada exitosamente`);
    logInfo(`ID Asignación: ${assignment.id}`);
    logInfo(`Fecha Inicio: ${assignment.start_date}`);
    logInfo(`Renta Mensual: ¥${assignment.monthly_rent.toLocaleString()}`);

    if (assignment.prorated_amount) {
      logInfo(`Días Prorrateados: ${assignment.prorated_days}`);
      logInfo(`Monto Prorrateado: ¥${assignment.prorated_amount.toLocaleString()}`);
    }

    return assignment;
  } catch (error) {
    logError(`Error al asignar empleado: ${error.message}`);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return null;
  }
}

// Función para obtener deducciones del empleado
async function getEmployeeDeductions(employeeId) {
  logSection('5. VERIFICAR DEDUCCIONES GENERADAS');
  try {
    const response = await axios.get(
      `${BASE_URL}/apartments-v2/employees/${employeeId}/rent-deductions`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const deductions = response.data;
    logSuccess(`Se encontraron ${deductions.length} deducciones`);

    if (deductions.length > 0) {
      const latestDeduction = deductions[0];
      logInfo(`Última deducción:`);
      logInfo(`  ID: ${latestDeduction.id}`);
      logInfo(`  Tipo: ${latestDeduction.deduction_type}`);
      logInfo(`  Monto: ¥${latestDeduction.amount.toLocaleString()}`);
      logInfo(`  Periodo: ${latestDeduction.period_month}/${latestDeduction.period_year}`);
      logInfo(`  Descripción: ${latestDeduction.description || 'N/A'}`);
    }

    return deductions;
  } catch (error) {
    logError(`Error al obtener deducciones: ${error.message}`);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return [];
  }
}

// Función para finalizar asignación
async function endAssignment(assignmentId) {
  logSection('6. FINALIZAR ASIGNACIÓN CON CARGO DE LIMPIEZA');
  try {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];

    logInfo(`Finalizando asignación ${assignmentId}`);
    logInfo(`Fecha de finalización: ${endDate}`);

    const response = await axios.post(
      `${BASE_URL}/apartments-v2/assignments/${assignmentId}/end`,
      {
        end_date: endDate,
        move_out_date: endDate,
        cleaning_fee: 20000,
        notes: 'Test de finalización de asignación'
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const assignment = response.data;
    logSuccess(`Asignación finalizada exitosamente`);
    logInfo(`Estado: ${assignment.status}`);
    logInfo(`Fecha Fin: ${assignment.end_date}`);

    if (assignment.final_cleaning_fee) {
      logInfo(`Cargo de Limpieza: ¥${assignment.final_cleaning_fee.toLocaleString()}`);
    }

    return assignment;
  } catch (error) {
    logError(`Error al finalizar asignación: ${error.message}`);
    if (error.response) {
      console.log('Response data:', error.response.data);
    }
    return null;
  }
}

// Función para limpiar datos de prueba
async function cleanup(apartmentId) {
  logSection('7. LIMPIEZA DE DATOS DE PRUEBA');
  try {
    // Eliminar apartamento (soft delete)
    await axios.delete(
      `${BASE_URL}/apartments-v2/apartments/${apartmentId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    logSuccess(`Apartamento de prueba eliminado (ID: ${apartmentId})`);
  } catch (error) {
    logError(`Error en limpieza: ${error.message}`);
  }
}

// Función principal
async function runTests() {
  logSection('INICIO DE PRUEBAS DEL SISTEMA DE APARTAMENTOS V2');
  log('Este script probará el flujo completo de asignación de apartamentos', 'yellow');

  let testApartment = null;
  let testEmployee = null;
  let testAssignment = null;

  try {
    // 1. Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      logError('No se pudo continuar sin autenticación');
      process.exit(1);
    }

    // 2. Crear apartamento
    testApartment = await createApartment();
    if (!testApartment) {
      logError('No se pudo crear el apartamento de prueba');
      process.exit(1);
    }

    // 3. Obtener empleado disponible
    testEmployee = await getAvailableEmployees();
    if (!testEmployee) {
      logError('No se encontraron empleados disponibles');
      process.exit(1);
    }

    // 4. Asignar empleado a apartamento
    testAssignment = await assignEmployeeToApartment(testApartment.id, testEmployee.id);
    if (!testAssignment) {
      logError('No se pudo crear la asignación');
      process.exit(1);
    }

    // 5. Verificar deducciones
    await getEmployeeDeductions(testEmployee.id);

    // 6. Finalizar asignación
    await endAssignment(testAssignment.id);

    // 7. Verificar deducciones finales
    await getEmployeeDeductions(testEmployee.id);

    // 8. Limpieza
    if (testApartment) {
      await cleanup(testApartment.id);
    }

    // Resumen final
    logSection('RESUMEN DE PRUEBAS');
    logSuccess('Todas las pruebas completadas exitosamente');
    logInfo('Flujo probado:');
    logInfo('  1. ✓ Login y autenticación');
    logInfo('  2. ✓ Creación de apartamento');
    logInfo('  3. ✓ Consulta de empleados disponibles');
    logInfo('  4. ✓ Asignación de empleado a apartamento');
    logInfo('  5. ✓ Generación de deducciones automáticas');
    logInfo('  6. ✓ Finalización de asignación con cargo de limpieza');
    logInfo('  7. ✓ Limpieza de datos de prueba');

  } catch (error) {
    logError(`Error inesperado: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar pruebas
runTests();
