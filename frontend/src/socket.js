import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'https://agentcom-wxmv.onrender.com';

const socket = io(SOCKET_URL);

export default socket;
