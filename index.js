const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');

let mainWindow;
const userDataPath = path.join(app.getPath('documents'), 'LeaveManagement');
const dataFilePath = path.join(userDataPath, 'leaveData.json');

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        icon: path.join(__dirname, 'icon.png')
    });

    mainWindow.loadFile('index.html');
    
    // Uncomment to open DevTools on start for debugging
    // mainWindow.webContents.openDevTools();
}

async function initializeData() {
    try {
        // Ensure directory exists
        await fs.ensureDir(userDataPath);

        // Check if data file exists
        const exists = await fs.pathExists(dataFilePath);
        if (!exists) {
            console.log('Creating initial data file...');
            
            // Load employee data from package.json
            const packageData = require('./package.json');
            
            // Convert employee data to simplified format
            const employees = packageData.employeeData.reduce((acc, emp) => {
                acc[emp.empId] = {
                    id: emp.empId,
                    name: emp.name,
                    designation: emp.designation,
                    leaveBalances: {
                        CL: emp.leaveBalance.CL,
                        RH: emp.leaveBalance.RH,
                        EL: emp.leaveBalance.EL,
                        HPL: emp.leaveBalance.HPL,
                        OOD: emp.leaveBalance.OOD === "NO_LIMIT" ? -1 : emp.leaveBalance.OOD
                    }
                };
                return acc;
            }, {});

            const initialData = {
                employeeData: {
                    employees,
                    leaveTypes: {
                        "CL": {
                            name: "Casual Leave",
                            maxDaysPerYear: 15,
                            description: "For personal matters and emergencies"
                        },
                        "RH": {
                            name: "Restricted Holiday",
                            maxDaysPerYear: 2,
                            description: "For religious and cultural occasions"
                        },
                        "EL": {
                            name: "Earned Leave",
                            maxDaysPerYear: 300,
                            description: "Accumulated based on service period"
                        },
                        "HPL": {
                            name: "Half Pay Leave",
                            maxDaysPerYear: 150,
                            description: "For extended leave requirements"
                        },
                        "OOD": {
                            name: "On Official Duty",
                            maxDaysPerYear: -1,
                            description: "For official work outside the institution"
                        }
                    }
                },
                leaveApplications: []
            };

            // Write the initial data file
            await fs.writeJson(dataFilePath, initialData, { spaces: 2 });
            console.log('Initial data file created successfully');
        }
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

app.whenReady().then(async () => {
    await initializeData();
    createWindow();
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers
ipcMain.handle('load-data', async () => {
    try {
        const data = await fs.readJson(dataFilePath);
        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        throw error;
    }
});

ipcMain.handle('save-data', async (event, data) => {
    try {
        await fs.writeJson(dataFilePath, data, { spaces: 2 });
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        throw error;
    }
});

ipcMain.handle('create-backup', async () => {
    try {
        const backupPath = path.join(
            userDataPath, 
            `backup_${new Date().toISOString().split('T')[0]}.json`
        );
        await fs.copy(dataFilePath, backupPath);
        return true;
    } catch (error) {
        console.error('Error creating backup:', error);
        throw error;
    }
});

ipcMain.handle('restore-backup', async () => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Select Backup File',
            defaultPath: userDataPath,
            filters: [{ name: 'JSON', extensions: ['json'] }],
            properties: ['openFile']
        });

        if (!result.canceled && result.filePaths.length > 0) {
            const backupPath = result.filePaths[0];
            const backupData = await fs.readJson(backupPath);
            
            if (backupData.employeeData && backupData.leaveApplications) {
                await fs.writeJson(dataFilePath, backupData, { spaces: 2 });
                return true;
            } else {
                throw new Error('Invalid backup file format');
            }
        }
        return false;
    } catch (error) {
        console.error('Error restoring backup:', error);
        throw error;
    }
});