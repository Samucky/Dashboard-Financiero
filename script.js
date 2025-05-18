console.log('Hello!');

// Objeto para almacenar todos los datos
let dashboardData = {
  incomes: [],
  expenses: [],
  savingsGoal: 0,
  currentSavings: 0
};

// Configuración de la URL del servidor
let SERVER_URL = 'http://localhost:3001'; // URL por defecto

// Función para cargar la configuración del servidor
async function loadServerConfig() {
  try {
    const response = await fetch('/config.json');
    if (response.ok) {
      const config = await response.json();
      SERVER_URL = config.serverUrl;
      console.log('Configuración del servidor cargada:', SERVER_URL);
    }
  } catch (error) {
    console.warn('No se pudo cargar la configuración, usando valores por defecto:', error);
  }
}

// Función para verificar la conexión con el servidor
async function checkServerConnection() {
  console.log('Intentando conectar al servidor...');
  try {
    const response = await fetch(`${SERVER_URL}/api/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Respuesta del servidor:', response.status);
    if (!response.ok) {
      console.error('Error en la respuesta del servidor:', response.status);
      throw new Error('Error de conexión');
    }
    
    const data = await response.json();
    console.log('Estado del servidor:', data);
    return true;
  } catch (error) {
    console.error('Error detallado de conexión:', error);
    return false;
  }
}

// Función para actualizar el estado del servidor
function updateServerStatus(status, message) {
  console.log('Actualizando estado:', status, message);
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  const errorMessage = document.getElementById('error-message');

  if (!statusDot || !statusText || !errorMessage) {
    console.error('Elementos de estado no encontrados en el DOM');
    return;
  }

  statusDot.className = 'status-dot ' + status;
  statusText.textContent = message;

  if (status === 'error') {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
  } else {
    errorMessage.classList.add('hidden');
  }
}

// Función para mostrar el estado del guardado
function updateSaveStatus(status, message) {
  const saveStatus = document.getElementById('save-status');
  if (!saveStatus) {
    console.error('Elemento save-status no encontrado');
    return;
  }
  
  saveStatus.textContent = message;
  saveStatus.className = 'save-status ' + status;
  
  setTimeout(() => {
    saveStatus.textContent = '';
    saveStatus.className = 'save-status';
  }, 3000);
}

// Función para cargar datos del servidor
async function loadDataFromServer() {
  console.log('Iniciando carga de datos...');
  try {
    updateServerStatus('connecting', 'Verificando conexión...');
    
    const isConnected = await checkServerConnection();
    if (!isConnected) {
      throw new Error('No se pudo establecer conexión con el servidor. Verifica que el servidor esté corriendo en http://localhost:3000');
    }

    console.log('Conexión establecida, cargando datos...');
    updateServerStatus('connecting', 'Cargando datos...');
    
    const response = await fetch(`${SERVER_URL}/api/data`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Respuesta de datos recibida:', response.status);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Datos recibidos:', data);
    
    dashboardData = data;
    updateTotals();
    updateIncomeTable();
    updateExpenseTable();
    
    updateServerStatus('connected', 'Conectado al servidor');
  } catch (error) {
    console.error('Error detallado al cargar datos:', error);
    updateServerStatus('error', `Error de conexión: ${error.message}. Asegúrate de que el servidor esté corriendo.`);
  }
}

// Función para guardar datos en el servidor
async function saveToServer() {
  console.log('Iniciando guardado de datos...');
  try {
    const isConnected = await checkServerConnection();
    if (!isConnected) {
      throw new Error('No se pudo establecer conexión con el servidor');
    }

    console.log('Enviando datos al servidor...');
    const response = await fetch(`${SERVER_URL}/api/data`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dashboardData)
    });

    console.log('Respuesta del servidor al guardar:', response.status);
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Resultado del guardado:', result);
    
    updateSaveStatus('success', 'Cambios guardados');
    return result;
  } catch (error) {
    console.error('Error detallado al guardar:', error);
    updateSaveStatus('error', `Error al guardar: ${error.message}`);
    throw error;
  }
}

// Función para actualizar los totales
function updateTotals() {
  const totalIncome = dashboardData.incomes.reduce((sum, income) => sum + parseFloat(income.amount), 0);
  const totalExpense = dashboardData.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
  const balance = totalIncome - totalExpense;

  document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;
  document.getElementById('total-expense').textContent = `$${totalExpense.toFixed(2)}`;
  document.getElementById('total-balance').textContent = `$${balance.toFixed(2)}`;
  document.getElementById('savings-goal').textContent = `$${dashboardData.savingsGoal.toFixed(2)}`;
  
  // Actualizar gráficos
  updateCharts(totalIncome, totalExpense);
  updateSavingsProgress();
  
  // Guardar en el servidor
  saveToServer();
}

// Función para actualizar los gráficos
function updateCharts(totalIncome, totalExpense) {
  // Actualizar gráfico de gastos
  spendingChart.data.datasets[0].data = [totalExpense, totalIncome - totalExpense];
  spendingChart.update();

  // Actualizar gráfico de ahorros
  savingsChart.data.datasets[0].data = [dashboardData.currentSavings, dashboardData.savingsGoal];
  savingsChart.update();
}

// Función para actualizar el progreso de ahorro
function updateSavingsProgress() {
  const progress = (dashboardData.savingsGoal > 0) 
    ? (dashboardData.currentSavings / dashboardData.savingsGoal) * 100 
    : 0;
  
  document.getElementById('progress-bar').style.width = `${Math.min(100, progress)}%`;
  document.getElementById('progress-bar').textContent = `${progress.toFixed(1)}%`;
  document.getElementById('current-savings').textContent = dashboardData.currentSavings.toFixed(2);
  document.getElementById('goal-amount').textContent = dashboardData.savingsGoal.toFixed(2);
  document.getElementById('remaining-amount').textContent = 
    (dashboardData.savingsGoal - dashboardData.currentSavings).toFixed(2);
}

// Function to update income
async function updateIncome(index) {
  const income = dashboardData.incomes[index];
  const { value: formValues } = await Swal.fire({
    title: 'Actualizar Ingreso',
    html:
      `<input id="swal-description" class="swal2-input" placeholder="Descripción" value="${income.description}">` +
      `<input id="swal-amount" class="swal2-input" type="number" placeholder="Monto" value="${income.amount}">`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Actualizar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      return {
        description: document.getElementById('swal-description').value,
        amount: parseFloat(document.getElementById('swal-amount').value)
      }
    }
  });

  if (formValues) {
    dashboardData.incomes[index] = {
      ...income,
      description: formValues.description,
      amount: formValues.amount
    };
    updateTotals();
    updateIncomeTable();
    Swal.fire('¡Actualizado!', 'El ingreso ha sido actualizado correctamente.', 'success');
  }
}

// Function to update expense
async function updateExpense(index) {
  const expense = dashboardData.expenses[index];
  const { value: formValues } = await Swal.fire({
    title: 'Actualizar Gasto',
    html:
      `<input id="swal-description" class="swal2-input" placeholder="Descripción" value="${expense.description}">` +
      `<input id="swal-amount" class="swal2-input" type="number" placeholder="Monto" value="${expense.amount}">`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Actualizar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      return {
        description: document.getElementById('swal-description').value,
        amount: parseFloat(document.getElementById('swal-amount').value)
      }
    }
  });

  if (formValues) {
    dashboardData.expenses[index] = {
      ...expense,
      description: formValues.description,
      amount: formValues.amount
    };
    updateTotals();
    updateExpenseTable();
    Swal.fire('¡Actualizado!', 'El gasto ha sido actualizado correctamente.', 'success');
  }
}

// Function to delete income with confirmation
async function deleteIncome(index) {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: "¡No podrás revertir esta acción!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    dashboardData.incomes.splice(index, 1);
    updateTotals();
    updateIncomeTable();
    Swal.fire(
      '¡Eliminado!',
      'El ingreso ha sido eliminado.',
      'success'
    );
  }
}

// Function to delete expense with confirmation
async function deleteExpense(index) {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: "¡No podrás revertir esta acción!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    dashboardData.expenses.splice(index, 1);
    updateTotals();
    updateExpenseTable();
    Swal.fire(
      '¡Eliminado!',
      'El gasto ha sido eliminado.',
      'success'
    );
  }
}

// Update the updateIncomeTable function
function updateIncomeTable() {
  const tbody = document.querySelector('#income-table tbody');
  tbody.innerHTML = '';
  
  dashboardData.incomes.forEach((income, index) => {
    const row = tbody.insertRow();
    const date = new Date(income.date).toLocaleDateString();
    row.innerHTML = `
      <td>${income.description}</td>
      <td>$${income.amount.toFixed(2)}</td>
      <td>${date}</td>
      <td>
        <button class="edit-btn" onclick="updateIncome(${index})">Editar</button>
        <button class="delete-btn" onclick="deleteIncome(${index})">Eliminar</button>
      </td>
    `;
  });
}

// Update the updateExpenseTable function
function updateExpenseTable() {
  const tbody = document.querySelector('#expense-table tbody');
  tbody.innerHTML = '';
  
  dashboardData.expenses.forEach((expense, index) => {
    const row = tbody.insertRow();
    const date = new Date(expense.date).toLocaleDateString();
    row.innerHTML = `
      <td>${expense.description}</td>
      <td>$${expense.amount.toFixed(2)}</td>
      <td>${date}</td>
      <td>
        <button class="edit-btn" onclick="updateExpense(${index})">Editar</button>
        <button class="delete-btn" onclick="deleteExpense(${index})">Eliminar</button>
      </td>
    `;
  });
}

// Update the add income button event listener
document.getElementById('add-income-btn').addEventListener('click', () => {
  const description = document.getElementById('income-description').value;
  const amount = parseFloat(document.getElementById('income-amount').value);
  
  if (description && amount > 0) {
    dashboardData.incomes.push({ 
      description, 
      amount, 
      date: new Date().toISOString(),
      id: Date.now()
    });
    updateTotals();
    updateIncomeTable();
    
    // Clear inputs
    document.getElementById('income-description').value = '';
    document.getElementById('income-amount').value = '';
    
    // Show success message
    Swal.fire({
      icon: 'success',
      title: '¡Ingreso agregado!',
      text: 'El ingreso ha sido guardado exitosamente.',
      timer: 2000,
      showConfirmButton: false
    });
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Por favor, ingresa una descripción y un monto válido.'
    });
  }
});

// Update the add expense button event listener
document.getElementById('add-expense-btn').addEventListener('click', () => {
  const description = document.getElementById('expense-description').value;
  const amount = parseFloat(document.getElementById('expense-amount').value);
  
  if (description && amount > 0) {
    dashboardData.expenses.push({ 
      description, 
      amount, 
      date: new Date().toISOString(),
      id: Date.now()
    });
    updateTotals();
    updateExpenseTable();
    
    // Clear inputs
    document.getElementById('expense-description').value = '';
    document.getElementById('expense-amount').value = '';
    
    // Show success message
    Swal.fire({
      icon: 'success',
      title: '¡Gasto agregado!',
      text: 'El gasto ha sido guardado exitosamente.',
      timer: 2000,
      showConfirmButton: false
    });
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Por favor, ingresa una descripción y un monto válido.'
    });
  }
});

document.getElementById('update-goal-btn').addEventListener('click', () => {
  const newGoal = parseFloat(document.getElementById('savings-goal-input').value);
  if (newGoal > 0) {
    dashboardData.savingsGoal = newGoal;
    updateTotals();
    document.getElementById('savings-goal-input').value = '';
  }
});

document.getElementById('add-savings-btn').addEventListener('click', () => {
  const amount = parseFloat(document.getElementById('add-to-savings').value);
  if (amount > 0) {
    dashboardData.currentSavings += amount;
    updateTotals();
    document.getElementById('add-to-savings').value = '';
  }
});

// Remove the import/export related event listeners and elements
document.getElementById('import-btn')?.remove();
document.getElementById('import-file-container')?.remove();

// Remove the import-related event listeners
const oldImportBtn = document.getElementById('import-btn');
if (oldImportBtn) {
  oldImportBtn.removeEventListener('click', () => {});
}

const oldConfirmImportBtn = document.getElementById('confirm-import-btn');
if (oldConfirmImportBtn) {
  oldConfirmImportBtn.removeEventListener('click', () => {});
}

// Remove the reset functionality since it's not needed without import/export
const oldResetBtn = document.getElementById('reset-btn');
if (oldResetBtn) {
  oldResetBtn.removeEventListener('click', () => {});
  oldResetBtn.remove();
}

// Iniciar la aplicación
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Iniciando aplicación...');
  try {
    await loadServerConfig();
    await loadDataFromServer();
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error);
    updateServerStatus('error', 'Error al iniciar la aplicación. Abre la consola para más detalles.');
  }
});
