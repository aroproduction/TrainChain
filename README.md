# TrainChain
A decentralized AI Training Platform.

## Project Structure

The project is divided into several main components:

- **backend**: Contains the backend server code and related utilities.
- **frontend**: Contains the frontend code built with React and Vite.
- **smart_contracts**: Contains the smart contracts and related scripts.
- **trainchain_app**: Contains the main application code, including backend, frontend, and web components.

## Backend

The backend is located in the `backend` directory and includes the following:

- `app.js`: Main application file.
- `controllers/`: Contains the controller logic.
- `db/`: Contains database-related files.
- `routes/`: Contains the route definitions.
- `server.js`: Server setup and configuration.
- `services/`: Contains service logic.
- `utils/`: Contains utility functions.

## Frontend

The frontend is located in the `frontend` directory and includes the following:

- `src/`: Contains the source code for the React application.
  - `pages/Team.jsx`: Displays the team members.
  - `components/Navbar.jsx`: Navigation bar component.
  - `assets/`: Contains image assets.
- `public/`: Contains public assets.
- `utils/`: Contains utility functions.
- `vite.config.js`: Vite configuration file.
- `tailwind.config.js`: Tailwind CSS configuration file.

### Team Members

The team members are listed in the `Team.jsx` file:

- **Sayan Patra**: Frontend Developer
- **Aritra Dutta Banik**: AI Model Integration and Docker
- **Shibam Pandit**: Backend Developer and Smart Contracts
- **Dibyajyoti Das**: Software Development

## Smart Contracts

The smart contracts are located in the `smart_contracts` directory and include the following:

- `contracts/`: Contains the smart contract code.
- `scripts/`: Contains deployment and other scripts.
- `test/`: Contains tests for the smart contracts.
- `hardhat.config.js`: Hardhat configuration file.
- `ignition/`: Contains Hardhat Ignition modules.

### Running Smart Contract Tasks

To run smart contract tasks, use the following commands:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js