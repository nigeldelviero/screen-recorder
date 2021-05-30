const {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  dialog,
} = require('electron');
const { Menu } = require('electron/main');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Select source
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Select video sources
ipcMain.on('select-video-sources', async (event) => {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
  });

  const menu = Menu.buildFromTemplate(
    inputSources.map((source) => {
      return {
        label: source.name,
        click: () => {
          event.sender.send('select-source', {
            name: source.name,
            id: source.id,
          });
        },
      };
    })
  );

  menu.popup(BrowserWindow.fromWebContents(event.sender));
});

// Handle stop recording
ipcMain.on('handle-stop', async (event) => {
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`,
  });

  // Send to renderer
  event.sender.send('save-file', filePath);
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
