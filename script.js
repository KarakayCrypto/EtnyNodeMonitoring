const table = document.querySelector('#nodes-table tbody');
const form = document.querySelector('form');
const nodeNameInput = document.querySelector('#node-name');
const nodeAddressInput = document.querySelector('#node-address');
const nodeRewardAddressInput = document.querySelector('#reward-address');
const etnyContractAddress = '0x549a6e06bb2084100148d50f51cf77a3436c3ae7';
// Load table data from local storage
const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
nodes.forEach((node) => {
  addNodeToTable(node.nodeName, node.nodeAddress, node.rewardAddress);
});
// Function to add a new row to the table
function addNodeToTable(nodeName, nodeAddress, rewardAddress) {
  const newRow = table.insertRow();
  const nameCell = newRow.insertCell();
  const addressCell = newRow.insertCell();
  const timeCell = newRow.insertCell();
  const statusCell = newRow.insertCell();
  const rewardAddressCell = newRow.insertCell();
  const rewardTimeCell = newRow.insertCell();
  const rewardCell = newRow.insertCell();
  const totalCell = newRow.insertCell();
  const deleteCell = newRow.insertCell();
  const linkTextAddress = `${nodeAddress.slice(0, 7)}--${nodeAddress.slice(-7)}`;
  const linkTextReward = rewardAddress ? `${rewardAddress.slice(0, 7)}--${rewardAddress.slice(-7)}` : '';
// Add nodename
  nameCell.textContent = nodeName;
// Add node adress
  addressCell.innerHTML = `<a href="https://blockexplorer.bloxberg.org/address/${nodeAddress}" target="_blank" data-address="${nodeAddress}">${linkTextAddress}</a>`;
// Add time since last transaction and status
getTimeSinceLastTransaction(nodeAddress, function(time,text,color) {
    timeCell.textContent = time;
    statusCell.textContent = text;
    statusCell.style.color = color;
  });
// Add reward adress
  rewardAddressCell.innerHTML = `<a href="https://blockexplorer.bloxberg.org/address/${rewardAddress}" target="_blank" reward-address="${rewardAddress}">${linkTextReward}</a>`;
// Add time since last reward and token amount
  getTimeSinceLastReward(rewardAddress, function(rewardtime,amount) {
    rewardTimeCell.textContent = rewardtime;
    rewardCell.textContent = amount;
  });
// Add total token amount
  totalTokenAmount(etnyContractAddress, rewardAddress, function(tokenBalance) {
    totalCell.textContent = tokenBalance;
  });
// Add delete button to row
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => {
    table.deleteRow(newRow.rowIndex - 1);
    deleteNodeFromStorage(nodeAddress);
  });
  deleteCell.appendChild(deleteBtn);
}
// Function to delete a row from storage
function deleteNodeFromStorage(nodeAddress) {
  const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
  const updatedNodes = nodes.filter((node) => node.nodeAddress !== nodeAddress);
  localStorage.setItem('nodes', JSON.stringify(updatedNodes));
}
// Function to add a node to storage
function addNodeToDatabase(nodeName, nodeAddress, rewardAddress) {
  const nodes = JSON.parse(localStorage.getItem('nodes')) || [];
  const newNode = {
    nodeName: nodeName,
    nodeAddress: nodeAddress,
    rewardAddress: rewardAddress
  };
  nodes.push(newNode);
  localStorage.setItem('nodes', JSON.stringify(nodes));
}
// Function to calculate days since last token transfer and amount
function getTimeSinceLastReward(nodeAddress, callback) {
  $.getJSON(`https://blockexplorer.bloxberg.org/api?module=account&action=tokentx&address=${nodeAddress}&sort=desc`, function(data) {
    const transactions = data.result;
    const latestTimestamp = transactions[0].timeStamp;
    const etnyTokens = transactions.filter((tx) => tx.tokenSymbol === 'ETNY');
    const latestEtnyTransaction = etnyTokens[0];
    const now = Math.floor(Date.now() / 1000);
    const secondsSinceLastTransaction = now - latestTimestamp;
    const daysSinceLastReward = Math.floor(secondsSinceLastTransaction / 86400);
    const hoursSinceLastReward = Math.floor(secondsSinceLastTransaction / 3600) - daysSinceLastReward*24;
    const timeSinceLastReward = daysSinceLastReward + ' days ' + hoursSinceLastReward + ' hours';
    const etnyBalance = latestEtnyTransaction ? latestEtnyTransaction.value : 0;
    const etny = etnyBalance /1000000000000000000 + ' ETNY';
    callback(timeSinceLastReward, etny);
  });
}
// Function to calculate time since last transaction
function getTimeSinceLastTransaction(nodeAddress, callback) {
  $.getJSON(`https://blockexplorer.bloxberg.org/api?module=account&action=txlist&address=${nodeAddress}`, function(data) {
    const transactions = data.result;
    const latestTimestamp = transactions[0].timeStamp;
    const now = Math.floor(Date.now() / 1000);
    const secondsSinceLastTransaction = now - latestTimestamp;
    const hoursSinceLastTransaction = Math.floor(secondsSinceLastTransaction / 3600);
    const minutesSinceLastTransaction = Math.floor((secondsSinceLastTransaction % 3600) / 60);
    const timeSinceLastTransaction = hoursSinceLastTransaction + ' hours ' + minutesSinceLastTransaction + ' minutes';
    var text = 'Online';
    var color = 'lime';
    if (hoursSinceLastTransaction < 13) {
      text = 'Online';
      color = 'lime';
    } else if (hoursSinceLastTransaction >= 13 && hoursSinceLastTransaction <= 23) {
      text = 'Warning';
      color = 'yellow';
    } else {
      text = 'Offline';
      color = 'red';
    }
    callback(timeSinceLastTransaction, text, color);
  });
}
//function to calculate total amount of token
function totalTokenAmount(contractAddress, address, callback) {
  $.getJSON(`https://blockexplorer.bloxberg.org/api?module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}`, function(data) {
    const token = data.result;
    const tokenBalance = token / 1000000000000000000 + ' ETNY';
    callback(tokenBalance);
  });
}
// Function update time since last transaction
function updateTimes() {
  const rows = table.rows;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const addressCell = row.cells[1];
    const timeCell = row.cells[2];
    const statusCell = row.cells[3];
    const nodeAddress = addressCell.querySelector('a').getAttribute('data-address');
getTimeSinceLastTransaction(nodeAddress, function(time,text,color) {
    timeCell.textContent = time;
    statusCell.textContent = text;
    statusCell.style.color = color;
    });
  }
}
// Function update time since last reward, last reward and total reward
function updateReward() {
  const rows = table.rows;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rewardAddressCell = row.cells[4];
    const rewardTimeCell = row.cells[5];
    const rewardCell = row.cells[6];
    const totalCell = row.cells[7];
    const rewardAddress = rewardAddressCell.querySelector('a').getAttribute('reward-address');
    getTimeSinceLastReward(rewardAddress, function(time,etny) {
      rewardTimeCell.textContent = time;
      rewardCell.textContent = etny;
    });
    totalTokenAmount(etnyContractAddress, rewardAddress, function(tokenBalance) {
      totalCell.textContent = tokenBalance;
    });
  }
}
// Event listener for form submit
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const nodeName = nodeNameInput.value.trim();
  const nodeAddress = nodeAddressInput.value.trim();
  const rewardAddress = nodeRewardAddressInput.value.trim();
  // Check if nodeAddress is blank or not a valid address
  const validAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (nodeAddress === '' || !validAddressRegex.test(nodeAddress)) {
    alert('Please enter a valid Boxberg wallet address.');
    return;
  }
  addNodeToTable(nodeName, nodeAddress, rewardAddress);
  addNodeToDatabase(nodeName, nodeAddress, rewardAddress);
  nodeNameInput.value = '';
  nodeAddressInput.value = '';
  nodeRewardAddressInput.value = '';
});
// Call the updateTimes function every minute
setInterval(updateTimes, 60000);
// Call the updateReward function every hour
setInterval(updateReward, 3600000);
