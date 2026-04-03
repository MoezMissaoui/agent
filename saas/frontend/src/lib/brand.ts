export const appName = import.meta.env.VITE_APP_NAME?.trim() || 'Synapse';

export const appInitial = appName.charAt(0).toUpperCase() || 'S';
