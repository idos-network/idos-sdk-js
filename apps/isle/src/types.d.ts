// Custom type declarations for the Isle app
// Add your custom types here

// Example: Custom type declarations
declare module "custom-module" {
  export interface CustomType {
    id: string;
    name: string;
    // Add your custom properties here
  }
}

// Example: Global type augmentations
declare global {
  interface Window {
    // Add any global window properties here
    customProperty?: string;
  }
}

// Example: Module augmentation
declare module "existing-module" {
  interface ExistingInterface {
    // Extend existing interfaces here
    newProperty?: string;
  }
}

export {};
