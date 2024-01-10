export const environment = import.meta.env.MODE

// Generally we use window.location.origin for the redirect_uri but if
// you may want to use a different URL for the redirect_uri. Make sure you
// make the related changes in @/config.js and @/plugins/auth.js

// export const AUTH_REDIRECT_URI = import.meta.env.VITE_AUTH_REDIRECT_URI;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""

export const applicationName = "Internal Data Porta"
export const applicationIcon = "mdi-cable-data"
export const hasSidebar = true
export const hasSidebarClosable = false
