# TrainChain

## Overview

TrainChain is a decentralized AI training platform that connects model requestors with high-performance GPU contributors using blockchain technology. It enables secure, efficient, and cost-effective distributed model training by leveraging the power of decentralized computing and blockchain-based incentives.

## Features

- **Decentralized AI Model Training**: Train complex neural networks faster with distributed computing power
- **Secure Transactions**: End-to-end encrypted data transfer with blockchain verification
- **IPFS for Data Storage**: Decentralized storage ensures data remains accessible and immutable
- **Token-Based Incentives**: Contributors earn tokens by providing computational resources
- **Intuitive User Interface**: Easy-to-use dashboard for monitoring and managing AI training jobs
- **Smart Contract Integration**: Automatic payment distribution and job verification

## Project Structure

The project consists of four main components:

```
TrainChain/
├── backend/              # Express.js backend server
├── frontend/             # React/Vite frontend application
├── smart_contracts/      # Hardhat smart contracts
└── trainchain_app/       # Python application for model training
```

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Python 3.8+
- Hardhat
- MetaMask wallet
- PostgreSQL database
- NVIDIA GPU (for contributors)

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/aroproduction/TrainChain.git
cd TrainChain
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create environment variables
cp .env.local .env
# Edit .env with your database credentials and other configurations

# Start the server
npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Create environment variables
cp .env.local .env
# Edit .env with your API endpoints and contract addresses

# Start development server
npm run dev

# For production build
npm run build
```

### 4. Smart Contracts Setup

```bash
cd smart_contracts
npm install

# Create environment variables
cp .env.local .env
# Edit .env with your database credentials and other configurations

# Configure Hardhat
# Edit hardhat.config.js with your network details

# Deploy contracts
npx hardhat compile
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

### 5. TrainChain App Setup (Python)

```bash
cd trainchain_app
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

pip install -r requirements.txt

# Start the application
python frontend/main.py

#For building the exe file from scratch
cd frontend
pyinstaller main.spec

#For running the exe file output
Run the frontend/dist/main.exe
```

## Detailed Directory Structure

### Backend
- `app.js`: Main application file
- `server.js`: Server configuration
- `controllers/`: API endpoint controllers
- `db/`: Database connection and models
- `routes/`: API routes
- `services/`: Business logic
- `utils/`: Utility functions and constants

### Frontend
- `src/`: React application source code
  - `pages/`: React page components
  - `components/`: Reusable UI components
  - `assets/`: Images and static assets
  - `context/`: React context providers
- `utils/`: Utility functions and constants
- `public/`: Static files

### Smart Contracts
- `contracts/`: Solidity smart contracts
- `scripts/`: Deployment and utility scripts
- `test/`: Contract tests
- `ignition/`: Hardhat Ignition modules

### TrainChain App
- `backend/`: Python backend code
- `web/`: Web interface templates
- `frontend/`: Compiled frontend distribution

## How it Works

1. **Requestors** upload AI models and datasets for training, offering reward tokens
2. **Contributors** provide GPU computing power to train the models
3. **Smart Contracts** manage job allocation, verification, and payment
4. **IPFS** stores model data securely and in a decentralized manner

## License

This project is licensed under the MIT License.

## Authors

- **Sayan Patra** - Frontend Developer
- **Aritra Dutta Banik** - AI Model Integration and Docker
- **Shibam Pandit** - Backend Developer and Smart Contracts
- **Dibyajyoti Das** - Software Development

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.