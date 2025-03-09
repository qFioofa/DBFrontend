const UIManager = {
    elements: {
        loginForm: () => document.getElementById('loginForm'),
        mainInterface: () => document.getElementById('mainInterface'),
        connectionForm: () => document.getElementById('connectionForm'),
        logoutBtn: () => document.getElementById('logoutBtn'),
        operationForms: {
            insert: () => document.getElementById('insertForm'),
            edit: () => document.getElementById('editForm'),
            delete: () => document.getElementById('deleteForm'),
            showAll: () => document.getElementById('showAll')
        },
        recordsList: () => document.getElementById('recordsList'),
        chatLog: () => document.getElementById('chatLog')
    },

    toggleAuthUI(isConnected) {
        this.elements.loginForm().classList.toggle('hidden', isConnected);
        this.elements.mainInterface().classList.toggle('hidden', !isConnected);
    },

    showOperationForm(operation) {
        // Hide all forms
        Object.values(this.elements.operationForms).forEach(form =>
            form().classList.add('hidden')
        );
        // Show selected form
        if(this.elements.operationForms[operation]) {
            this.elements.operationForms[operation]().classList.remove('hidden');
        }
    },

    addLogMessage(message, isError = false) {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${isError ? 'error' : 'info'}`;
        logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.elements.chatLog().appendChild(logEntry);
        this.elements.chatLog().scrollTop = this.elements.chatLog().scrollHeight;
    },

    getFormData(formType) {
        const form = document.getElementById(`${formType}Form`);
        return Object.fromEntries(new FormData(form).entries());
    },

    displayRecords(records) {
        this.elements.recordsList().innerHTML = records.map(record => `
            <div class="record-card">
                <strong>${record.fullName}</strong>
                <div>📞 ${record.phone}</div>
                ${record.note ? `<div>📝 ${record.note}</div>` : ''}
            </div>
        `).join('');
    }
};

// Database Simulation
const createDatabaseConnection = () => {
    let connection = null;
    let records = [];

    return {
        connect: async (config) => {
            UIManager.addLogMessage('Connecting to database...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            connection = {
                status: 'connected',
                config,
                // Simulated database operations
                insert: async (data) => {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    records.push(data);
                    return { success: true, data };
                },
                update: async (phone, newData) => {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    const index = records.findIndex(r => r.phone === phone);
                    if (index === -1) return { success: false };
                    records[index] = { ...records[index], ...newData };
                    return { success: true, data: records[index] };
                },
                delete: async (phone) => {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    records = records.filter(r => r.phone !== phone);
                    return { success: true, data: { phone } };
                },
                getAll: async () => {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    return { success: true, data: [...records] };
                }
            };

            UIManager.addLogMessage('Connected successfully!');
            return connection;
        },

        disconnect: () => {
            connection = null;
            UIManager.addLogMessage('Disconnected');
        },

        getConnection: () => connection,
        getStatus: () => connection?.status || 'disconnected'
    };
};

// Application Controller
const setupAppController = () => {
    const dbConnection = createDatabaseConnection();
    let currentConnection = null;

    const handleConnect = async (event) => {
        event.preventDefault();
        const config = {
            host: document.getElementById('host').value,
            port: parseInt(document.getElementById('port').value),
            user: document.getElementById('user').value,
            password: document.getElementById('password').value,
            database: document.getElementById('database').value,
            rememberMe: true
        };

        try {
            currentConnection = await dbConnection.connect(config);
            UIManager.toggleAuthUI(true);
            UIManager.showOperationForm('showAll');
            await handleDatabaseOperation('showAll')();

            if (config.rememberMe) {
                localStorage.setItem('dbConfig', JSON.stringify(config));
            }
        } catch (error) {
            UIManager.addLogMessage(`Connection failed: ${error.message}`, true);
        }
    };

    const handleLogout = () => {
        dbConnection.disconnect();
        currentConnection = null;
        UIManager.toggleAuthUI(false);
        localStorage.removeItem('dbConfig');
    };

    const handleDatabaseOperation = (operation) => async (e) => {
        if(e) e.preventDefault();
        if (!currentConnection) return;

        try {
            let result;
            let formData = {};

            if(operation !== 'showAll') {
                formData = UIManager.getFormData(operation);
            }

            switch(operation) {
                case 'insert':
                    result = await currentConnection.insert(formData);
                    break;
                case 'edit':
                    result = await currentConnection.update(formData.phone, formData);
                    break;
                case 'delete':
                    result = await currentConnection.delete(formData.phone);
                    break;
                case 'showAll':
                    const response = await currentConnection.getAll();
                    UIManager.displayRecords(response.data);
                    return;
            }

            // Construct formatted log message
            let logContent = `${operation.charAt(0).toUpperCase() + operation.slice(1)}`;

            UIManager.addLogMessage(logContent);

            const updated = await currentConnection.getAll();
            UIManager.displayRecords(updated.data);
        } catch (error) {
            UIManager.addLogMessage(`Error: ${error.message}`, true);
        }
    };


    const initializeEventListeners = () => {
        // Auth events
        UIManager.elements.connectionForm().addEventListener('submit', handleConnect);
        UIManager.elements.logoutBtn().addEventListener('click', handleLogout);

        // Operation buttons
        document.querySelectorAll('.operation-btn').forEach(button => {
            button.addEventListener('click', () => {
                const operation = button.dataset.operation;
                UIManager.showOperationForm(operation);
                if(operation === 'showAll') handleDatabaseOperation('showAll')();
            });
        });

        // Form submissions
        ['insert', 'edit', 'delete'].forEach(operation => {
            UIManager.elements.operationForms[operation]().addEventListener(
                'submit',
                handleDatabaseOperation(operation)
            );
        });
    };

    const checkSavedCredentials = () => {
        const savedConfig = localStorage.getItem('dbConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            document.getElementById('host').value = config.host;
            document.getElementById('port').value = config.port;
            document.getElementById('user').value = config.user;
            document.getElementById('database').value = config.database;
        }
    };

    // Initialization
    checkSavedCredentials();
    initializeEventListeners();
    UIManager.toggleAuthUI(false);
};

// Bootstrap application
document.addEventListener('DOMContentLoaded', setupAppController);