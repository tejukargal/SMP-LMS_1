# GitHub Deployment Version - Setup Guide

This version of the Leave Management System is designed to work when deployed from a GitHub repository. The main changes are:

1. Data is stored locally within the application folder instead of in the Documents directory
2. Excel exports are saved to the user's Downloads folder
3. Added notification system for pending leave requests

## Setup Instructions

### 1. Repository Structure

Make sure your repository has the following structure:
```
leave-management-system/
├── data/           # Directory to store application data
├── index.js        # Main Electron process
├── index.html      # Application UI
├── package.json    # Dependencies and application configuration
└── README.md       # Instructions
```

### 2. Create the Data Directory

Create a folder named `data` in the root of your repository. This is where the application will store its data files.

### 3. Install Dependencies

```bash
npm install electron xlsx fs-extra
npm install --save-dev electron-builder
```

### 4. Update package.json Scripts

Make sure your package.json has these scripts:

```json
"scripts": {
  "start": "electron .",
  "build": "electron-builder"
}
```

### 5. Run the Application

```bash
npm start
```

## Functionality Notes

- All employee data is now stored in `data/leaveData.json` within the application directory
- Leave history can be exported to Excel files in the user's Downloads folder
- The HR Panel tab will pulse with a notification badge when there are pending leave requests

## Important Changes from the Original Version

1. **Data Storage**: Changed from using the OS Documents folder to a local 'data' folder inside the application directory
2. **Excel Export**: Now saves files to the user's Downloads folder
3. **Notification System**: Added visual notification for pending approvals
4. **Path Handling**: Using path.join() for cross-platform compatibility

## Building for Distribution

```bash
npm run build
```

## Troubleshooting

If employee data is not loading:
1. Check that the 'data' directory exists in the repository
2. Verify the application has write permissions to this directory
3. Check the console for any error messages
4. Try manually creating a 'data' folder in the same directory as the application executable
