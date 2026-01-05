import Swal from 'sweetalert2';
import { getThemeColors } from '../state/useEventStore';
import { useEventStore } from '../state/useEventStore';

// Get theme colors from event store
const getTheme = () => {
  const event = useEventStore.getState().event;
  return getThemeColors(event);
};

// Helper function to remove unwanted checkboxes from SweetAlert2
const removeCheckboxes = () => {
  // Use setTimeout to ensure DOM is ready
  setTimeout(() => {
    const checkboxes = document.querySelectorAll('.swal2-popup .swal2-checkbox, .swal2-popup .swal2-checkbox-label, .swal2-popup input[type="checkbox"]:not([id*="swal"]):not([class*="custom"])');
    checkboxes.forEach((el) => {
      (el as HTMLElement).style.display = 'none';
      (el as HTMLElement).style.visibility = 'hidden';
      (el as HTMLElement).remove();
    });
  }, 0);
};

// Centralized SweetAlert2 configuration to match app styling
export const getSwalConfig = () => {
  const theme = getTheme();
  const config: any = {
    // Base configuration
    confirmButtonColor: theme.primary,
    cancelButtonColor: theme.secondary,
    confirmButtonText: 'Save',
    cancelButtonText: 'Cancel',
    focusConfirm: false,
    // Explicitly disable checkbox input
    input: undefined,
    inputOptions: undefined,
    inputValue: undefined,
    customClass: {
      container: 'swal2-custom-container',
      popup: 'swal2-custom-popup',
      title: 'swal2-custom-title',
      htmlContainer: 'swal2-custom-html',
      input: 'swal2-custom-input',
      textarea: 'swal2-custom-textarea',
      select: 'swal2-custom-select',
      confirmButton: 'swal2-custom-confirm',
      cancelButton: 'swal2-custom-cancel',
    },
    // Default styling
    width: '600px',
    padding: '2rem',
    borderRadius: '0.75rem',
    backdrop: true,
    allowOutsideClick: false,
    allowEscapeKey: true,
    // Remove checkboxes when modal opens/renders
    didOpen: () => {
      removeCheckboxes();
    },
    didRender: () => {
      removeCheckboxes();
    },
  };
  return config;
};

// For backward compatibility
export const swalConfig = getSwalConfig();

// Helper to inject theme CSS variables
const injectThemeCSS = () => {
  const theme = getTheme();
  const root = document.documentElement;
  root.style.setProperty('--swal-primary', theme.primary);
  root.style.setProperty('--swal-secondary', theme.secondary);
  root.style.setProperty('--swal-text', theme.text);
};

// Helper function to create a form modal with consistent styling
export const createFormModal = (options: {
  title: string;
  html: string;
  preConfirm?: () => any;
  editingItem?: any;
}) => {
  injectThemeCSS();
  return Swal.fire({
    ...getSwalConfig(),
    title: options.title,
    html: options.html,
    preConfirm: options.preConfirm,
    showCancelButton: true,
  });
};

// Helper function for delete confirmation
export const createDeleteModal = (itemName?: string) => {
  injectThemeCSS();
  const theme = getTheme();
  return Swal.fire({
    ...getSwalConfig(),
    title: 'Are you sure?',
    text: itemName ? `Delete "${itemName}"?` : "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: theme.secondary,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
  });
};

// Helper function for success message
export const createSuccessModal = (title: string, message?: string) => {
  injectThemeCSS();
  return Swal.fire({
    ...getSwalConfig(),
    title,
    text: message,
    icon: 'success',
    confirmButtonText: 'OK',
    showCancelButton: false,
  });
};

// Helper function for error message
export const createErrorModal = (title: string, message?: string) => {
  injectThemeCSS();
  return Swal.fire({
    ...getSwalConfig(),
    title,
    text: message,
    icon: 'error',
    confirmButtonText: 'OK',
    showCancelButton: false,
  });
};

