// Inicializar gráficos
const spendingChart = new Chart(
  document.getElementById('spendingChart'),
  {
    type: 'doughnut',
    data: {
      labels: ['Gastos', 'Disponible'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#e74c3c', '#2ecc71'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.label + ': $' + context.raw.toFixed(2);
            }
          }
        }
      }
    }
  }
);

const savingsChart = new Chart(
  document.getElementById('savingsChart'),
  {
    type: 'bar',
    data: {
      labels: ['Ahorro Actual', 'Meta de Ahorro'],
      datasets: [{
        label: 'Cantidad',
        data: [0, 0],
        backgroundColor: ['#3498db', '#9b59b6'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toFixed(2);
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': $' + context.raw.toFixed(2);
            }
          }
        }
      }
    }
  }
); 