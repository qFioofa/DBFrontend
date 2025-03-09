const UIManager = {
    elements: {
        loginForm: () => document.getElementById('loginForm'),
        mainInterface: () => document.getElementById('mainInterface'),
        chatLog: () => document.getElementById('chatLog'),
        connectionForm: () => document.getElementById('connectionForm'),
        logoutBtn: () => document.getElementById('logoutBtn')
    },

    toggleAuthUI: (isConnected) => {
        UIManager.elements.loginForm().classList.toggle('hidden', isConnected);
        UIManager.elements.mainInterface().classList.toggle('hidden', !isConnected);
    },

    addLogMessage: (message, isError = false) => {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${isError ? 'error' : 'info'}`;
        logEntry.innerHTML = `[${new Date().toLocaleTimeString()}] ${message}`;
        UIManager.elements.chatLog().appendChild(logEntry);
        UIManager.elements.chatLog().scrollTop = UIManager.elements.chatLog().scrollHeight;
    },

    getConnectionConfig: () => ({
        host: document.getElementById('host').value,
        port: parseInt(document.getElementById('port').value),
        user: document.getElementById('user').value,
        password: document.getElementById('password').value,
        database: document.getElementById('database').value,
        rememberMe: document.getElementById('rememberMe').checked
    }),

    handleConnectionError: (error) => {
        UIManager.addLogMessage(`Connection failed: ${error.message}`, true);
    }
};

const createDatabaseConnection = () => {
    let connection = null;

    return {
        connect: async (config) => {
            UIManager.addLogMessage('Connecting to database...');

            // Simulate connection
            await new Promise(resolve => setTimeout(resolve, 1000));

            connection = {
                status: 'connected',
                config,
                query: async (sql) => {
                    // Simulate query execution
                    await new Promise(resolve => setTimeout(resolve, 500));
                    return { rows: [], count: 0 };
                }
            };

            UIManager.addLogMessage('Connected successfully!');
            return connection;
        },

        disconnect: () => {
            connection = null;
            UIManager.addLogMessage('Disconnected');
        },

        getStatus: () => connection?.status || 'disconnected'
    };
};

const createOperationManager = (dbConnection) => {
    const executeOperation = async (operation, data) => {
        try {
            UIManager.addLogMessage(`Executing ${operation} operation...`);
            // Simulate database operation
            await new Promise(resolve => setTimeout(resolve, 300));
            return { success: true, data };
        } catch (error) {
            UIManager.handleConnectionError(error);
            return { success: false };
        }
    };

    return {
        insert: (data) => executeOperation('insert', data),
        edit: (data) => executeOperation('edit', data),
        delete: (data) => executeOperation('delete', data)
    };
};

const setupAppController = () => {
    const dbConnection = createDatabaseConnection();
    const operationManager = createOperationManager(dbConnection);

    const handleConnect = async (event) => {
        event.preventDefault();
        const config = UIManager.getConnectionConfig();

        try {
            await dbConnection.connect(config);
            UIManager.toggleAuthUI(true);

            if (config.rememberMe) {
                localStorage.setItem('dbConfig', JSON.stringify(config));
            }
        } catch (error) {
            UIManager.handleConnectionError(error);
        }
    };

    const handleLogout = () => {
        dbConnection.disconnect();
        UIManager.toggleAuthUI(false);
        localStorage.removeItem('dbConfig');
    };

    const handleOperation = (operation) => {
        return async () => {
            const data = {}; // Get data from UI
            const result = await operationManager[operation](data);
            if (result.success) {
                UIManager.addLogMessage(`${operation} operation completed`);
            }
        };
    };

    const initializeEventListeners = () => {
        // Form submissions
        UIManager.elements.connectionForm().addEventListener('submit', handleConnect);
        UIManager.elements.logoutBtn().addEventListener('click', handleLogout);

        // Database operations
        document.querySelectorAll('.operation-btn').forEach(button => {
            button.addEventListener('click', handleOperation(button.dataset.operation));
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
            document.getElementById('rememberMe').checked = true;
        }
    };

    // Initialization
    checkSavedCredentials();
    initializeEventListeners();
    UIManager.toggleAuthUI(false);
};

// Initialize application
document.addEventListener('DOMContentLoaded', setupAppController);